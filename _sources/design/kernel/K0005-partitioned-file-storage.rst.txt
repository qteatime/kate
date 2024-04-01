#K0005 — Partitioned File Storage
=================================

:Author: Niini
:Started: 2023-12-08
:Last updated: 2023-12-25
:Status: Design in progress


Timeline
--------

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
2023-12-12  —                —
=========== ================ =====================


Summary
-------

Kate has two distinct needs for storing arbitrary binary data under well-known
names:

* **Reliably persistent data**: E.g.: cartridge data needs to be available for
  as long as the player is able to launch that cartridge, thus needs a reliable
  and persistent backing storage.

* **Ephemeral work area for large data**: E.g.: the importer needs to access
  files from a ZIP archive to process them into a Kate cartridge.

A backing file store must thus address these two use cases while also making
sure that we guarantee all other security and privacy guarantees Kate has.
That is, data must be partitioned to the processes that own them, with no
way of distinct processes to forge access to these pieces of data.

To that end we introduce a new file backing storage on top of the
Origin Private File System API that uses content-addressed binaries
in distinct buckets, which are also divided into distinct "lifecycle"
partitions.

Keep in mind that we need:

* **Partitioned lifecycle**: All buckets are subject to be garbage collected
  once there are no more references to it, but the frequency of garbage
  collection might vary.

* **Strong capabilities**: Buckets can only be accessed by the owning process,
  and they must be handed a capability for it --- there must be no way of
  forging capabilities for arbitrary buckets (i.e.: no root directory
  accessible from the process).

* **Memory friendly**: Since we will be using the storage for large binaries,
  the API must allow interacting with this storage using bounded memory.


Surface interface
-----------------

.. code-block:: typescript

  interface FileStore {
    get_partition(name: string): Promise<Partition>;
    from_key(key: PersistentKey): Promise<{partition: Partition, bucket: Bucket}>;
    gc(): Promise<void>;
  }

  interface Partition {
    create(): Promise<Bucket>;
    get(id: BucketId): Promise<Bucket>;
    release(bucket: Bucket): void;
    release_persistent(key: PersistentKey): void;
    persist(bucket: Bucket): PersistentKey;
  }

  interface Bucket {
    put(data: ArrayBuffer): Promise<File>;
    file(id: FileId): File;
  }

  interface File {
    id: FileId;
    read(): Uint8Array;
    delete(): void;
  }

Note the lack of explicit deletion for buckets: they're garbage collected
automatically once there are no more references to it!


Ephemeral and persistent buckets
--------------------------------

All buckets start their life as ephemeral ones --- they're kept alive for as
long as there are in-memory references to them, and they're garbage collected
as soon as no in-memory references to them remain. Like with regular
programming language garbage collection, bucket garbage collection is not
*observable* by the code, since as far as code is concerned there's no way
of getting to the bucket anymore. Kate also does not expose storage space
metrics to regular code, which must assume the user has "an unlimited supply
of storage space".

Buckets can however be *promoted* to a persistent bucket. Persistent buckets
are "ephemeral" buckets that have long-lived in-storage references. For example,
buckets backing cartridge data start as ephemeral ones during installation,
and progress to persistent just before the cartridge is reified in the
database. From that point on, the bucket is only garbage collected if
no in-memory **and** in-storage references to it remain.

For tracking in-storage references Kate does a best-effort of managing the
reference counter manually from the reference holders --- e.g.: during
cartridge installation the cartridge manager service will manually release
the persistent reference it holds in storage. But the garbage collection
process will also ocasionally scan its persistent buckets and check if
the persistent references it knows about are still pointing back to the
bucket. This means that even if the reference is not manually released,
e.g.: if an installation process fails between persisting the bucket and
persisting the cartridge in the database, the next time the garbage collector
runs it'll notice that there's no database recording pointing back, and it'll
adjust the reference counter accordingly, most likely resulting in the bucket
being collected.


Persistent references
"""""""""""""""""""""

A ``PersistentKey`` or persistent reference is a reference stored on both the
bucket side and the persistent storage side. This includes details on the
process or service that holds the persistent reference, and allows the garbage
collector to verify if that reference is still valid, thus getting around
issues with unreliable reference counting, and also helping in detecting
storage leaks.

It's defined as a sum type of with a unique tag for each service, plus the
details the service needs to verify if the reference is still valid. For
example, cartridge data buckets are persisted with the cartridge identifier
and version, which means that the garbage collector can point to the cartridge
manager where it should look for the reference. It also includes the
partition id and bucket id, which allows the garbage collector to know if the
holder of that reference is pointing back to the exact bucket that the
garbage collector is looking at.

The bucket back-references are important because not all storage processes
are immutable. For example, it *is* possible to overwrite a cartridge with
another of the same id/version in some circumstances, but because Kate cannot
guarantee that they'll have the same content it has to use a different bucket
for the new installation. This can result in a case where the bucket X points
to cartridge A@v1, but cartridge A@v1 points back to a different bucket Y,
allowing the bucket X to be safely garbage collected.


Ephemeral buckets from cartridges
"""""""""""""""""""""""""""""""""

Cartridges are also able to spawn new ephemeral buckets into existence for
their own storage needs. For example, a cartridge that needs to work with
large archive files might choose to unpack those files to a bucket to keep
memory usage bounded at reasonable levels, rather than increasing linearly
with the archive size.

With this usage of ephemeral buckets our in-memory approach does not hold
as well, since the Kernel and the cartridge processes run in different,
isolated memory spaces. This is solved by putting a service between the
file storage and the cartridge that manages buckets for that cartridge
process specifically, and keeps them alive for as long as the process
needs it to be alive --- which in worst cases is until the process dies.

Further, we need to have bounds on the storage usage to prevent malicious
or misbehaving cartridges from unfairly degrading the underlying storage.
There's no real one-size-fits-all here, as cartridges that a user run
may have wildly different requirements, so this limit must be configurable
by the user, though it should never exceed 60% of the Kate storage quota.


Formal semantics
----------------

You can think of the file storage as a collection of reference-counted buckets
holding arbitrary objects. Buckets cannot hold other buckets. Partitions are
only used to give the GC a generational-ish behaviour where long-lived
partitions don't need to be scanned as often. It also helps with debugging.
For that reason it's not a part of the formal semantics, since it doesn't
affect the semantics of buckets and files.

.. code-block:: haskell

  type Ref r = uint;
  type Store s = [{r1, b1}, ..., {rN, bN}]
  type Bucket b = {bid :: unique, [f1, ..., fN]};
  type File f = {fid :: unique, data :: bytes};

  Store s ::
    | create-bucket() -> {bid, s2}
    | drop(bid) -> s2
    | copy(bid) -> s2
    | gc() -> s2
    | put-file(bid, bytes) -> {fid, s2}
    | read-file(bid, fid) -> bytes
    | delete-file(bid, fid) -> s2
    | has-file(bid, fid) -> bool

Reference-counted semantics are reflected here on the explicit ``drop`` and
``copy`` operations, which increase and decrease the reference counter
respectively.


Bucket life-cycle
"""""""""""""""""

``s.create-bucket()``
'''''''''''''''''''''

.. code-block:: haskell

  s [...].create-bucket() =
    let Id = allocate-storage-with-unique-id();
    {Id, [{1, {Id, []}}, ...]}

That is, when we create a bucket we just reserve a unique identifier in the
storage for it. There's no possibility of giving buckets a recognisable name
because the file storage is not meant for regular browsing, but rather just
as a backing storage for different front-ends.

Note that buckets start their lifecycle with the reference counter set to 1,
since we *are* holding onto the reference and passing it to the caller.


``s.gc()``
''''''''''

.. code-block:: haskell

  [].gc() = []

  [{refs, {id, files}}, ...].gc() =
    if refs = 0:
      free-allocated-storage(id);
      [...].gc()
    if refs > 0: [{refs, {id, files}}, ...[...].gc()]

That is, the GC process just goes through each bucket, checks their reference
counter, and frees all buckets whose reference counters reached 0. At the end
of this process the storage will only hold the list of buckets that are still
alive.

Note that there's no defined semantics for negative reference counters, the
process would get stuck there, but a practical implementation **must** ensure
that negative references are not possible.


``b.drop()``
''''''''''''

.. code-block:: haskell

  s [{refs, {id, data}, ...}].drop(id) when refs > 0 =
    s [{refs - 1, {id, data}}, ...];

That is, ``drop()`` decreases the reference counter, but it is not defined
for cases where it's called on a bucket whose reference counter is already
at zero.

A practical implementation **must not** let this happen: you cannot call a
function on an object no one holds a reference to.


``b.copy()``
''''''''''''

.. code-block:: haskell

  s [{refs, {id, data}, ...}].copy(id) when refs > 0 =
    s [{refs + 1, {id, data}}, ...];

Once again, ``copy()`` increases the reference counter, but it is not defined
for cases where it's called on a bucket whose reference counter is already at
zero.

A practical implementation **must not** let this happen: you cannot call a
funciton on an object no one holds a reference to.



File management
"""""""""""""""

``s.put-file(bid, bytes)``
''''''''''''''''''''''''''

.. code-block:: haskell

  s [{refs, {id, [...]}}, ...].put-file(id, bytes) when refs > 0 =
    let File = unique-file-id();
    {File, s [{refs, {id, [{File, bytes}, ...], ...]};

That is, we allocate a new unique identifier for the file and store whatever
raw bytes we're provided in that space. We then return this file id.

As always, the bucket must be alive.


``s.read-file(bid, fid)``
'''''''''''''''''''''''''

.. code-block:: haskell

  s [{refs, {id, [{fid, bytes}, ...]}}, ...].read-file(id, fid) when refs > 0 =
    bytes

That is, we can retrieve the bytes associated with a given file id inside of
the bucket as long as the bucket is alive, and the file exists in the bucket.


``s.delete-file(bid, fid)``
'''''''''''''''''''''''''''

.. code-block:: haskell

  s [{refs, {id, [{fid, _}, ...]}}, ...].delete-file(id, fid) when refs > 0 =
    s [{refs, {id, [...]}}, ...]

That is, we can delete a file in the bucket as long as the bucket is alive and
the file exists in the bucket.


``s.has-file(bid, fid)``
''''''''''''''''''''''''

.. code-block:: haskell

  s [{refs, {id, [{fid, _}, ...]}}, ...].has-file(id, fid) when refs > 0 = true;
  s [{refs, {id, [...]}}, ...].has-file(id, fid) when refs > 0 = false;

That is, a file exists when we can find it in the bucket. Note that this
operation **requires** the bucket to exist and be alive none the less.


How is this feature dangerous?
------------------------------

Kate uses the file storage for critical components, and thus its correct
working depends on it. Here we consider risks from users', cartridges', and
Kate's perspectives.


**Files being removed while they're needed**:
  Because GC is an automatic storage reclamation process, there's a risk that
  a bug in the GC would lead to corrupted console data in various levels,
  including complete failure to boot.

  Kate mitigates this in two ways: one, it only uses the file storage for 
  non-kernel components (so boot is always possible); two, it uses a
  uses persistent references to keep long-lived buckets from being reclaimed,
  and relies on the browser's GC to keep track of reference aliasing.

  That said, bugs in the file storage's reference counter and GC are still
  problematic. A stable version of Kate should at least look into stochastic
  validation of the algorithm as well (e.g.: by checking against a reference
  implementation), given that persistent keys are managed manually.

**Corrupted files**:
  Because files are written in a non-transactional fashion to the underlying
  storage, there's a risk that a failure of the storage or device could lead
  to corrupted data.

  Kate does not mitigate this in the file storage directly, however more
  sensitive parts (e.g.: cartridge data) hold both signatures and integrity
  hashes for the stored data. Furthermore, we rely on the browser implementation
  of the file storage to smooth out other underlying file system issues, though
  the specifics are not covered by the specification.

**Storage filling attacks**:
  Because the file storage is intended to be used from cartridges, there's a
  risk that a malicious or misbehaving cartridge might fill the user's device
  storage in an unfair manner.

  File storage is subject to similar quotas as the object storage, and thus
  users are in control of how much space they wish to allow a cartridge to
  use.

**Unintended access to files**:
  Because the file storage is shared between all processes in Kate, there's
  a risk that a malicious cartridge may get access to someone else's buckets.

  While the file storage itself does not implement any access control, it's
  only exposed directly to the Kate kernel, and front-ends to it that are
  exposed to cartridges are expected to maintain the proper quota and access
  controls themselves. Persistent keys provide the primitive means to do so.


References and additional material
----------------------------------

* `Origin-Private File System <https://web.dev/articles/origin-private-file-system>`_
* `File System living standard <https://fs.spec.whatwg.org/>`_