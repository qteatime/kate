#A0001 — Object Store API
=========================

:Author: Q\.
:Started: 2023-04-18
:Last updated: 2023-06-11
:Status: M1 Shipped

Timeline
--------

**M1: Storage API**

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
2023-04-20  2023-04-20       2023-04-22
=========== ================ =====================

**M2: Migration API**

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
—           —                —
=========== ================ =====================



Summary
-------

Kate Cartridges work as a read-only file system; the applications contained
in them are free to read any of the files packaged with the cartridge, but
they cannot modify those files, nor store any additional data.

There are two distinct scenarios where this is an issue:

* Longer games need to store information about the user progress, so players
  can play through the game in many shorter sessions;

* Tools packaged for Kate might need to store arbitrary user content in the
  same way desktop applications do.

To address both of these use cases, this document proposes a securely
partitioned object store, much resembling a flat, tag-based file system.


The object store
----------------

The Kate Object Store API is a bucket-based API, similar to many other recent
:term:`cloud object storages <object storage>`, however we still have to contend with
the fact that the same object store (the same underlying storage location)
needs to be exposed to each Kate Cartridge in a way that one cartridge cannot
see the data of another cartridge. In this sense, the storage API must employ
a secure, stable partitioning scheme.

Kate uses the following partitioning strategy::

    Root > Cartridge ID > Cartridge Version > Bucket > Object

The Kate emulator can manipulate anything from Root and below. A cartridge can
manipulate anything below its id and version. A bucket pointer can manipulate
any object inside that specific bucket. And an object pointer can manipulate
anything in that specific object. This gives us a nice object-capability
property where we can always restrict the powers we grant, but never escalate
them; there's no way to go from a bucket pointer to a cartridge id pointer,
for example, access flows in exactly one direction.

If we look at this partitioning as a textual path, then an example could be
the following::

    / "qteati.me/hello" / "1.0" / "data" / "high-scores"

It's still important to note that, while the partitioning *may* be expressed
as a textual path, in a similar vein to hierarchical file system paths,
there's no textual representation you can use to access data. That is,
there is no API like ``storage.read("/cartridge/1.0/data/high-scores")``,
and this API will never exist. Instead, cartridges are handed a strong
capability-secure object that provide access to a specific partition,
and through calling methods in this object they may access subpartitions;
but partition access can never be constructed directly from cartridge code.


Why a versioned storage?
""""""""""""""""""""""""

The first incarnation of the object storage did not include the Cartridge
Version partition. This works up to the point that all version upgrades are
successful and fully backwards compatible, but it's a hard requirement to
impose on all cartridges.

Ideally, players should be able to upgrade to a new version, and safely
downgrade if things do not go according to their expectations. No upgrades
should result in corrupted or unusable data lingering in the system.

A version partition gives cartridges a way of performing data migrations
safely as well, since the object store by itself does not provide any
transactional guarantees. This would be much harder to do in an unversioned
store, as each cartridge would need to re-invent transactional migration
in their own way.

Lastly, there's still a special **Unversioned** partition. Cartridges may
choose to store data in the unversioned partition for things that are not
expected to change from one version to another, and that they wish to share
between versions. For example, this could be user-generated data that is not
really tied to a specific cartridge version.


Upgrades and migrations
"""""""""""""""""""""""

Because the storage is partitioned by versions, we need to allow cartridges
to upgrade from one version to another. When a cartridge is ran, it can
register a handler for the Storage Upgrade event. Kate will call this handler
providing the old version, a read-only reference to the old version's
partition, and a migration assiting object.

Cartridges can either implement their own migration strategy, or use the
migration assisting object if they do not need to perform any custom migration
policies. The assisting object provides methods for copying one or all buckets
from the previous version to the current one, unchanged, as well as discarding
all data from the previous version.

Once a cartridge performs a successful migration, the Storage Upgrade event
will not fire again. Cartridges can check if a migration needs to be performed
before registering a handler for it with a separate method of the object
storage API.


Notes on the cartridge identifier
"""""""""""""""""""""""""""""""""

The Kate Object Storage API needs a stable and unforgeable identifier for its
partitioning system to work. In Kate, cartridge identifiers are mandated to be
unique and stable (i.e.: only one cartridge with a given identifier can be
installed in the console at any given time). However, cartridge identifiers
are likewise public: each cartridge announces its identifier to everyone in
plain text.

Kate makes this work by relying on the Kernel being the only piece of software
that has the ability to turn a cartridge identifier into a pointer to that
specific partition. This way we don't have to worry about cartridges forging
access to other cartridges' partitions, however we require the Kernel to be
a trusted overseer of all operations on the object storage.


What's in an object?
""""""""""""""""""""

An object consists of a bag of well-known meta-data (creation and modification
dates, estimated size, mime-type), possibly a set of custom meta-data
(arbitrarily specified by the cartridge), and the stored data.

Objects in this API are stored in IndexedDB, and thus can include almost
any value that can be stored in IndexedDB (see the
:ref:`quota estimation section <object storage size estimation>` for additional restrictions
Kate imposes.

.. _object storage size estimation:

Size and quotas
"""""""""""""""

Usage of the object storage API is subject to specific quotas, which means
that cartridges have a specific amount of data they're allowed to store, and
any requests to store more data than that limit will be blocked by the
Kernel process.

A restricted storage is necessary to prevent cartridges (intentionally or not)
from hogging the entire storage in the device. Each cartridge gets 64 MB of
storage that is not gated through any capability, and it may ask for a larger
storage space through a storage capability. This gives users a better idea of
what they're signing up for by using the cartridge, particularly if they use
a more limited device.


Limits
''''''

To ensure that each cartridge has a fair amount of access to the storage
resources, Kate imposes usage quotas on them. By default, cartridges can store:

* Up to 64MB of data (estimated when writing);
* Up to 10000 (ten thousand) entries across all buckets;

These restrictions sound fairly harsh, but they're based on the fact that save
data for most games that would target Kate as a platform (small indie
RPGs/VNs/story-games) are not excessively larger than this.

From the author's personal experience, the largest Unity-based visual novel
(size-wise) is ~27 MB counting all save files; the largest Ren'Py-based
visual novel (size-wise) is ~5 MB counting all save files; and the game
with the largest file count for save data the author has includes ~1800 XML
files (~10 MB).

Though defaults can be calibrated (upwards) at any point in time, games that
do wish to request more storage resources than the default ones can do so
through a storage capability:

.. code-block:: yaml

  custom-storage-quota:
    max-size: <bytes>
    max-records: <positive integer>

Each field is optional, a cartridge may ask just for a size increase, just
for a record count increase, or for both; along with providing a reason
for the request. Kate should not actually show the reason directly to users,
as that would be possibly misleading (intentionally or not), rather it should
allow users to look at the reason as additional information, but only after
they're properly informed of the change and its associated performance impacts.


Technical implementation
------------------------

Kate uses a single IndexedDB store for all cartridges, with a compound index
for partitioning. The Kernel maintains a single ``ObjectStore`` service that
handles all operations on this store, and must ensure that they adhere
to the security properties established in this document.

Because the Kernel (which includes the ObjectStore) and each cartridge run
in different processes, cartridges cannot interact with the ObjectStore
directly. Instead, a proxy object is injected in the cartridge's process
as one of the client Kate APIs, and this proxy sends requests to the Kernel
process in order to operate on the object store on the cartridge's behalf

In the Kernel process, such messages are handled by first identifying the
originating cartridge process, and then resolving its
``Cartridge ID > Cartridge Version`` partition pointers based on the process
metadata, rather than any information provided by the cartridge in the message.
This guarantees that the Kernel only hands partitions that the sender of the
message rightfully possesses a right to access.

Any result of the operation is sent back to the cartridge process as a
separate message. The client Kate API takes care of matching the Kernel
reply with the original request through the message identifier it generated
to make the request. This implies that all operations in the object storage
are inherently asynchronous.


How is this API dangerous?
--------------------------

For the Kate Object Storage API we deal with seven main dangers, looking
at cartridges', Kate's, and users' perspectives:

**Breaking isolation**:
  Because all cartridges share the same underlying storage, there's an inherent
  threat that they might be able to affect other cartridge's data.

  We mitigate this through the partitioning scheme described in this document,
  and an enforcement of strong capabilities for accessing each partition.
  Barring bugs in the Kate kernel, a cartridge shouldn't be able to get a
  reference for a partition it doesn't own.

**Degrading Kate resources**:
  Because all cartridges share the same object storage resource, there's a
  threat that some cartridges may use it poorly (intentionally or not)
  and affect every other cartridge's performance.

  We mitigate this with storage quotas. Cartridges have a set amount of
  resources (storage space, keys) allocated to them for using the shared
  storage, and they may request more resources from the user through storage
  capabilities, but their harm potential is bounded by such quotas.

**Degrading the host system**:
  Because storage is shared between Kate and the host system, there's a
  threat that Kate cartridges may unfairly (intentionally or not) occupy
  a significant amount of the host system's storage, causing slowdown or
  issues with the host system's common operation.

  We mitigate this with storage quotas as well. Kate cannot guarantee that
  the host system's usage is fair, however when running in Web Mode browsers
  will have a smaller quota of the system resources allocated to the page
  which further mitigates this.

**Incompatible data**:
  When a user upgrades a cartridge from one version to another, there's a
  threat that the new version cannot work on the data stored by the old
  version. In such case, the user might be unable to run the cartridge at all.

  We mitigate this by versioning storages, so each cartridge version gets
  its own isolated partition. And we provide a migration process where
  a cartridge can manage its own data upgrade in a controlled manner.

**Data inconsistency**:
  Because storage is handled by the Kernel process, there may be
  inconsistencies in the cartridge's view of the storage and the
  contents of the storage.

  We mitigate this by making all storage operations atomic on the Kernel
  side, and ensuring that they're ordered through the use of transactions
  and the serialisation of requests in the main IPC channel.

  There's one further disconnect between the Kernel and the underlying
  storage as Kate uses relaxed durability for the object storage, so there
  may be edge cases where a success is reported to the cartridge before
  data is written to the disk.

**Lack of granular boundaries in cartridges**:
  Because Kate treats a cartridge as a single trust boundary, third party
  libraries included in it could be independently compromised and in turn
  attempt to compromise or exfiltrate the data in the cartridge's partitions.

  We partly mitigate this by fully sandboxing the cartridge and not giving
  it network access by default. Many of the interesting attacks
  (e.g.: data exfiltration) become inviable with the default capabilities.

  Because we don't track provenance, there's no way of properly
  mitigating data in the object storage from being modified by a malicious
  third party included in the cartridge, however. The only thing Kate
  mitigates is the possibility of such malicious third party causing damage
  to other cartridges' data, through full isolation.

**Unwanted data stored**:
  Because each cartridge partition is fully managed by the cartridge,
  there's no realistic way for Kate to know if the player has given
  any meaningful consent to the data being stored.

  We partly mitigate this by specifying quotas for cartridges, but that
  cannot cover the cases where the content being stored is in itself
  unwanted (or unlawful). There's not enough information tracked in
  metadata to trace it back to a specific operation, however each entry
  will at least be linked back to the cartridge+version with a timestamp.


The API
-------

The object storage API is divided in two aspects: the Core Language and the
Surface API. We'll cover the two separately, as only the Core Language is
given a formal semantics in this document (the Surface API is derived from it,
and semantics are trivially extended there by its compositional nature).


Core Language
"""""""""""""

The core language for object storage deals with partitions, objects,
queries, and primitive operations on objects. We assume that all values are
represented by strong, unforgeable references, and expect queries to support
narrowing privileges, but not escalating them.

A formal definition of this language is as follows:

.. code-block:: typescript

  type Reference r;
  type Partition p :: Branch {Children :: [p1, ..., pN]}
                    | Leaf {Children :: [o1, ..., oN]};
  type Object o :: {Id :: r, Metadata, Data};

  Query q ::
    | pA.sub-partitions() -> [pB1, ..., pBN]      (if pA is Branch)
    | p.objects() -> [o1, ..., oN]                (if p is Leaf)

  Manipulate m ::
    | p1.partition(p2) -> p3                      (if p1 is Branch)
    | p1.add(o1) -> o2                            (if p1 is Leaf)
    | p1.update(o1) -> o2                         (if p1 is Leaf)
    | p1.delete(r1) -> nothing                    (if p1 is Leaf)


Essentially, we have two sorts of partitions: a "Branch" partition can
only have sub-partitions (e.g.: the root or cartridge partitions). Meanwhile a
"Leaf" partition can only have sub-objects (in this document, that's only the
bucket partitions). Note that here the notation ``[a1, ..., aN]`` denotes an
**unordered set**, not a sequence, so no duplicate ``a`` values are allowed.

An object is a bag consisting of an unique reference, a set of arbitrary
metadata, and a set of arbitrary data. Objects can only exist within leaf
partitions. Note that real objects *do* have more properties than what's
specified above, the formal model however only cares about describing
enough to talk about the security properties we outline in this document.

Query operations are how we go from one partition to another partition
or object. Queries work only on partitions, thus there's no way of taking
one object and reaching one of its containing partitions. Query operations
are also partial, with *sub-partitions* only working on Branch partitions,
and *objects* only working on Leaf partitions.

Manipulate operations allow us to modify partitions and objects. All
manipulations likewise originate from partitions, and all operations are
partial, with *partition* requiring a Branch partition, and all other
operations that deal with objects requiring a Leaf partition.


Invariants
""""""""""

Besides the global invariants we inherit from sets, the storage also requires
that object ids be unique *within a Leaf partition*. That is, two distinct
partitions P1 and P2 might house an object with id R1, and different contents,
however there may not be two objects in the object set of P1 sharing the
same reference id.

There's also global invariants regarding to fairness of use of the shared
storage. The number of leaf partitions within a cartridge version bucket
cannot exceed 1000 (one thousand). And the number of entries within a
cartridge version bucket (counting all leaf partitions) cannot exceed
10000 (ten thousand). These limits may be configurable in the future.


Semantics for the Core Language
"""""""""""""""""""""""""""""""

Here we provide operational semantics for the operations above.

``p.sub-partitions()``::

    Branch{[p1, ..., pN]}.sub-partitions() = [p1, ..., pN]

Given a strong reference to a Branch partition we may access any partition below it.


``p.objects()``::

    Leaf{[o1, ..., oN]}.objects() = [o1, ..., oN]

Given a strong reference to a Leaf partition we may access any object below it.


``p.partition(p2)``::

    Branch{[pA1, ..., pAN]}.partition(pB) = Branch{[pA1, ..., pAN, pB]}

Given a strong reference to a Branch partition, whose set of sub-partitions
does not contain ``pB``, we produce a new Branch partition that includes ``pB``.


``p.add(o)``::

    Leaf{[oA1, ..., oAN]}.add(oB) = Leaf{[oA1, ..., oAN, oB]}

Given a strong reference to a Leaf partition, whose set of sub-objects does
not contain ``oB``, we produce a new Leaf partition that includes ``oB``.


``p.update(o)``::

    Leaf{[{rA1, mA1, dA1}, ..., {rAN, mAN, dAN}]}.update({rA1, mB1, dB1}) =
      Leaf{[{rA1, mB1, dB1}, ..., {rAN, mAN, dAN}]};

Given a strong reference to a Leaf partition, if its set of sub-objects
already includes one with the same unique reference of the object we have,
then we replace the previous object at that unique reference with the new
one in the set.


``p.delete(r)``::

    Leaf{[{r1, m1, d1}, {r2, m2, d2}, ..., {rN, mN, dN}]}.delete(r1) =
      Leaf{[{r2, m2, d2}, ..., {rN, mN, dN}]}

Given a strong reference to a Leaf partition, if its set of sub-objects
includes one with the same unique reference we have, then we produce a
new Leaf partition that does not contain the object with that reference.


A note on the partition requirements
""""""""""""""""""""""""""""""""""""

One may think the requirement that you'd need a partition for operating on
an object may be too weak; going from the semantics above, there is no way
of giving one mutable access to a single object within a partition.

However, in the context of Kate, cartridges already get handed a Branch
partition one level above all of its Leaf partitions (i.e.: they get the
whole Cartridge Version partition). There's no further boundaries that
Kate can realistically draw where a stricter access policy would be
feasible. However, cartridge code is free to use its own language
abstractions to create more restrictive access capabilities; it's just
that Kate cannot enforce that restriction.


Surface API
"""""""""""

The surface API is a high-level TypeScript API built on top of the Core
Language semantics specified above. We only cover the client part of it,
which is exposed to the cartridge under the Kate APIs. It's defined as follows:

.. code-block:: typescript

  type StableId = string;
  type UniqueId = string;

  // A CartridgeVersion partition
  type CartridgeStorage {
    get_bucket(id: StableId): Bucket {
      if the partition exists: return it from sub-partitions()
      otherwise: create a new one with partition(new bucket)
    }
  }

  class Bucket {
    clear(): Bucket {
      for each object in objects(): delete(object.id)
    }

    list(): Object[] {
      return the set of objects()
    }

    get(id: UniqueId): Object {
      if id exists in objects(): return that object
      otherwise, halt.
    }

    try_get(id: UniqueId): Object | null {
      if id exists in objects(): return that object
      otherwise return null.
    }

    add(id: UniqueId, meta: Metadata, data: any): Object {
      if id exists in objects(): halt
      otherwise: add({id, meta, data})
    }

    put(id: UniqueId, meta: Metadata, data: any): Object {
      if id exists in objects(): update({id, meta, data})
      otherwise: add({id, meta, data})
    }

    delete(id: UniqueId): void {
      if id exists in objects(): delete(id)
      otherwise do nothing
    }
  }


All operations above are atomic from the Cartridge's perspective, even if
they're composed of multiple Core Language operations. That is, if a
cartridge issues ``bucket.clear()``, there is no way to observe a
partial deletion of objects in the bucket, either the cartridge will
see all objects before that call, or no objects.


Size estimation
"""""""""""""""

When objects are inserted in the object storage, Kate needs to make sure
the whole cartridge storage weights less than the quota assigned to that
cartridge. This document proposes that sizes be tracked at insertion time
and cached. That is, every time an object is inserted in the store we estimate
its size, look if it will fit according to the currently cached quota usage,
and then update the quota usage if we can insert the object.

Essentially, this cache is maintained as follows::

  let U be the usage cache as the tuple {size (in bytes), count (in objects)}
  let Q be the quota limits as the tuple {size (in bytes), count (in objects)}
  let the cache context be the tuple {U, Q}

  ({US1, UC1}, {QS1, QC1}).add(O) =
    let S = estimate(O);
    if (US1 + S < QS1) and (UC1 + 1 < QC1): {US1 + S, UC1 + 1}
    otherwise: halt due to not enough storage

  ({US1, UC1}, {QS1, QC1}).update(O2) =
    let O1 = previous object with the same id as O2;
    let SCurrent = estimate(O2);
    let SPrevious = estimate(O1);
    if (US1 - SPrevious + SCurrent < QS1): {US1 - SPrevious + SCurrent, UC1}
    otherwise: halt due to not enough storage

  ({US1, UC1}, {QS1, QC1}).delete(Id) =
    let O = the object with the given id;
    {US1 - estimate(O), UC1 - 1}


Because Kate ultimately does not control the underlying storage or the value
serialisation, an accurate disk usage cannot be provided here. We use the
following algorithm as a best-effort estimate instead::

  // for scalar types we just use assume the value's size
  estimate(x :: number) = 8;
  estimate(x :: boolean) = 2;
  estimate(x :: null) = 2;
  estimate(x :: undefined) = 2;
  estimate(x :: Date) = 8;

  // for bigints we do a naive estimation based on the number of bytes from
  // a hex representation
  estimate(x :: bigint) = bytes(x)

  // for strings we do a very naive estimation based on UTC16. We do the same
  // with regexes
  estimate(x :: string) = length(x) * 2;
  estimate(x :: RegExp) = length(string(x)) * 2;

  // for arrays we sum all value estimations, but ignore any possible headers
  estimate(x :: A[]) = sum(x.map(estimate));

  // for objects we sum key and value estimations, but ignore possible headers
  estimate(x :: {k: v}) =
    sum(keys(x).map(estimate)) + sum(values(x).map(estimate));

  // for byte arrays we return whatever byte-length it reports
  estimate(x :: TypedArray) = byte-length(x);


We do not support serialisation of blobs or file handles currently in this
schema, but that's something that can be investigated in the future if the
need arises.


Migrations
----------

To deal with version upgrades, Kate provides cartridges with a form of
transactional and controlled migration. A cartridge can check if a storage
upgrade is needed (by checking the old storage version), and then register
an upgrade transaction. The upgrade transaction offers atomic methods for
common operations such as "copy all data unchanged".

The root object in the storage API (:py:mod:`KateAPI.store`) is then defined
thus::

    class KateStorage {
      unversioned(): CartridgeStorage {
        return the unversioned partition in the cartridge partition;
      }

      current_version(): CartridgeStorage {
        return the versioned partition in the cartridge partition;
      }

      // a StorageMigration if this cartridge has replaced another cartridge
      // AND it has not performed a migration yet
      previous_version(): null | StorageMigration;
    }

    class StorageMigration {
      // The version of the cartridge we replaced
      version: { major: positive integer, minor: positive integer };

      // Happens atomically
      migrate(process: (MigrationTransaction) => Promise<void>): Promise<void>;
    }

    class MigrationTransaction {
      // a restricted capability without mutation methods
      previous_storage: ReadonlyCartridgeStorage;

      // a transactional version of the current storage, same capabilities
      current_storage: TransactionalCartridgeStorage;

      copy_all() {
        for each object(o) in each bucket(b): get_bucket(b).add(o)
      }

      abort(reason: string): void;
    }
    

Though we only provide a protocol for the migration (and not its formal
semantics), the major part of its semantics is still defined by the Core
Language described here. The big difference between the regular
CartridgeStorage and the one provided in the migration is its
transactional nature.

When one calls ``migrate``, the process that runs either succeeds
and migrates all data, or fails and migrates no data. Writes from within
the process cannot be seen from outside of the process; in that way
it's fully atomic.

You can think of the migration process as follows::

    let S1 = current storage;
    let S2 = previous storage;
    lock S1 and S2;
    let MS = transactional storage of S1;
    if migrate(transaction(MS, S2)) is not aborted and current storage matches S1:
      commit MS, erase S2;
    otherwise:
      fail the migration, discard MS;
    unlock S1;

There's a full lock taken of the storage at the beginning, which means that
writes outside of the migration process will fail, but reads will still see
only the state of the storage before the migration started.


Additional references
---------------------

* `Building a secure key/value store <https://robotlolita.me/diary/2022/12/kv-crochet/>`_

* `IndexedDB <https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API>`_

