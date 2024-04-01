``store`` — Saving state
========================

.. py:module:: KateAPI.store
  :synopsis: Allows saving and reading cartridge state.

The Object Store API (``store``) provides features to persist the cartridge
state across sessions, and to read it. The storage is not transactional,
but operations in it are atomic—that is, if a call to storing data returns
a successful response, then the data has been properly persisted on the
device's storage, but there are no guarantees for modifying multiple
objects in the store.

Unlike most file systems, the Object Store API uses a design that's more
similar to recent object stores offered in the cloud. That is, a flat
set of objects can be divided into buckets. Kate has a few other partitions
that have a special role in its security-oriented design, these are further
described in the :doc:`Object Storage API design document </design/api/A0001-object-storage>`.


Partitions, buckets, and objects
--------------------------------

The storage is partitioned by the cartridge's versions, with a special
"unversioned" partition that is shared by all versions of the cartridge.
Cartridges are expected to save data whose format may change in the
versioned partition, whereas data that is guaranteed to never change
can be stored in the unversioned partition.

Each partition is divided into a set of buckets. A cartridge can create
up to 1,000 (one thousand) buckets to place objects on. A bucket is
similar to a folder in a hierarchical file system, in that it may
contain other objects, but buckets are not hierarchical—there's no such
thing as a bucket inside of a bucket.

Buckets hold a set of objects. These are similar to files in that they
contain some data and some meta-data, but all operations on objects are
atomic and the API currently does not support streaming. A cartridge can
create up to 10,000 (ten thousand) objects, independent of how they're
organised into buckets.


Upgrades and downgrades
-----------------------

Data stored in versioned partitions needs to be *migrated* when the
user updates from one version of the cartridge to another. This only
happens on upgrades—that is, if the player upgrades the cartridge from
version 1.0 to version 2.0, then you'll have a chance to convert the
save data from the previous version to the new version when your cartridge
is first launched. For downgrades, e.g.: if the user installs version 1.0
of the cartridge where they had version 2.0 before, there's no migration:
the player gets whatever was stored in the previous version's partition, and
the new version's data sits untouched.

Version partitions are still kept when the user upgrades or downgrades
a cartridge, but partitions that are not pointed to by any cartridge are
marked as "unused". Unused partitions may be removed after some period
of time depending on the storage cleaning policies that Kate uses. This
still gives players time to safely test if an upgrade will work for them,
while still having the option of going back to the old version as if
no upgrade ever happened.


Selecting a partition
---------------------

Usage of the storage API starts by selecting which partition you want to
read or store data in. Kate provides two functions for this:

.. py:function:: versioned() -> OSCartridge

  Returns a versioned partition for the cartridge.


.. py:function:: unversioned() -> OSCartridge

  Returns an unversioned partition for the cartridge, where data is shared
  by all versions.


Managing a partition
--------------------

From a partition you can query or manipulate the buckets that organise the
objects in it. It's also possible to query the status of the storage usage,
so your cartridge can know when the data it's storing is nearing its storage
quota.

The default quota for each partition is 64 MB. Cartridges are encouraged
to keep the storage usage below this number, as going over will cause store
operations to fail with no recovery option.


.. py:class:: OSCartridge(channel: KateIPC, versioned: boolean)
  
  Manages a specific storage partition for the cartridge. You cannot construct
  instances of this class directly, instead you should use the
  :py:func:`versioned` or :py:func:`unversioned` functions of the storage
  API to get a properly initialised instance.


Managing buckets
""""""""""""""""

.. py:method:: OSCartridge.list_buckets([count: number]) -> Promise[Array[OSBucket]]
  :async:

  :param count: If provided, limit the number of buckets returned.

  Retrieves a list of buckets that exist in the current partition.


.. py:method:: OSCartridge.add_bucket(name: string) -> Promise[OSBucket]
  :async:

  :param name: The name of the bucket, up to 255 UTF-16 characters.
  :raises EExists: if there's already a bucket with the same name.
  :raises EQuota: if the bucket count quota is exceeded.
  :raises EValidation: if the name is over 255 characters.

  Creates a bucket in the partition, granted there is none already with the given name.
  The name can be anything, but it's limited to 255 UTF-16 characters.

  The method will fail if the cartridge has already reached its quota
  of buckets for the partition. You can check the quota and usage through
  :py:meth:`usage`.


.. py:method:: OSCartridge.get_bucket(name: string) -> Promise[OSBucket]
  :async:

  :param name: The name of the bucket.
  :raises ENotFound: if there's no bucket with the given name in the partition.
  :raises EValidation: if the name is over 255 characters.

  Returns the bucket with the given name, if one exists.


.. py:method:: OSCartridge.ensure_bucket(name: string) -> Promise[OSBucket]
  :async:

  :param name: The name of the bucket, up to 255 UTF-16 characters.
  :raises EQuota: if there's no bucket with the name, and creating one would violate the bucket quota.
  :raises EValidation: if the name is over 255 characters.

  If there's already a bucket with the given name, returns a bucket object
  for it. Otherwise attempts to create a new bucket with the given name and
  return it.

  Creating a new bucket may fail if there's no remaining quota for creating
  buckets. See :py:meth:`usage`.


.. py:method:: OSCartridge.delete_bucket(name: string)
  :async:

  :param name: The name of the bucket, up to 255 UTF-16 characters.
  :raises EValidation: if the bucket name is over 255 characters.
  :raises ENotFound: if the bucket does not exist in the partition.

  Deletes a bucket from the partition. The bucket being deleted must exist.


Quota and usage
"""""""""""""""

Each partition has a specified quota. Players are shown this when they
inspect a cartridge's storage usage, but a cartridge can also query its
own quota and usage data for each partition.


.. py:class:: QuotaDetails

  .. py:property:: size_in_bytes
    :type: number

    The size of all data stored in a partition, in bytes.

  .. py:property:: buckets

    The number of buckets in a partition.

  .. py:property:: entries

    The number of entries in a partition.


.. py:class:: PartitionUsage

  .. py:property:: limits
    :type: QuotaDetails
    
    The quota assigned for the partition.

  .. py:property:: usage
    :type: QuotaDetails

    The current resource usage for the partition.


.. py:method:: OSCartridge.usage() -> Promise[PartitionUsage]
  :async:

  Returns the current quota for the partition, and how much of the quota
  is un use.


Managing objects
----------------

Objects are contained in buckets, so in order to manage objects you must
first acquire a bucket reference—either by reading an existing one or
creating a new bucket.

.. py:class:: OSBucket(channel: KateIPC, versioned: boolean, name: string)

  Manages a specific bucket in a specific partition. You cannot construct
  instances of bucket objects directly. Instead, you get references to
  buckets through the :py:class:`OSCartridge` class, for example by using
  :py:meth:`OSCartridge.ensure_bucket`.


Objects
"""""""

An object is made out of a meta-data section, and its data. Data in the storage
API uses a structured format, and so preserves the same types from the
JavaScript host, although it supports only a subset of these types.

The types supported are:

* Primitives: string, number, bigint, boolean, null, undefined;
* Built-in scalars: Date, RegExp;
* Built-in containers: Array, Map, Set;
* Built-in packed binaries: TypedArray (Uint8Array, Uint16Array, ...), ArrayBuffer;
* Plain objects (i.e.: no functions, no prototype chains);

To know how sizes for each of these are computed, see the
:doc:`Object Storage API design document </design/api/A0001-object-storage>`.


.. py:class:: ObjectMetadata

  Contains the metadata for a stored object.

  .. py:property:: key
    :type: string

    A unique identifier for the object in the bucket.

  .. py:property:: created_at
    :type: Date

    A timestamp of when the object was first added to the bucket.

  .. py:property:: updated_at
    :type: Date

    A timestamp of the last write to this object in the bucket.

  .. py:property:: type
    :type: string

    A :term:`MIME type` associated with the object.

  .. py:property:: size
    :type: number

    The size of the object, in bytes.

  .. py:property:: metadata
    :type: {[key: string]: unknown}

    An object with additional and arbitrary metadata associated with the object.
    This counts towards the size of the object as well, and is likewise limited
    to the same types as the object's data is.

.. py:class:: Object

  Extends :py:class:`ObjectMetadata` with a field for the object's data.

  .. py:property:: data
    :type: unknown

    The data stored for the object.


Querying objects
""""""""""""""""

.. py:method:: OSBucket.count() -> Promise[number]
  :async:

  Returns the number of objects in the bucket.


.. py:method:: OSBucket.list([count: number]) -> Promise[Array[ObjectMetadata]]
  :async:

  :param count: If provided, the returned list will contain at most this number of elements.

  Returns the metadata for all (or up to ``count``) objects in the bucket.


.. py:method:: OSBucket.read(key: string) -> Promise[Object]
  :async:

  :param key: The unique key identifying the object.
  :raises ENotFound: if the object does not exist in the bucket.

  Returns the object associated with the given unique key in the bucket.


.. py:method:: OSBucket.read_data(key: string) -> Promise[unknown]
  :async:

  :param key: The unique key identifying the object.
  :raises ENotFound: if the object does not exist in the bucket.

  A convenience for :py:meth:`read` which returns the contents of the object.
  Equivalent to::

      (await bucket.read(key)).data


.. py:method:: OSBucket.try_read(key: string) -> Promise[Object | null]
  :async:

  :param key: The unique key identifying the object.

  Returns the object associated with the given key in the bucket, or ``null``
  if there's no such object.


.. py:method:: OSBucket.try_read_data(key: string) -> Promise[unknown | null]
  :async:

  :param key: The unique key identifying the object.

  Returns the contents of the object associated with the given key in the
  bucket, if it exists. Otherwise returns ``null``.

  Note that since ``null`` is still valid content, it's impossible to tell
  from the return of this function whether the object truly exists in the
  storage or not.


Updating and deleting objects
"""""""""""""""""""""""""""""

.. py:class:: NewEntry
  
  .. py:property:: type
    :type: string

    The :term:`MIME type` of the stored entry.

  .. py:property:: metadata
    :type: {[key: string]: unknown}

    A mapping of arbitrary metadata associated with the object. Will count
    towards its stored size.

  .. py:property:: data
    :type: unknown

    The contents of the object, as a JavaScript structure.


.. py:method:: OSBucket.write(key: string, entry: NewEntry)
  :async:

  :param key: The unique key identifying this object in the bucket. Counts towards the stored size.
  :param entry: The object to store, counts towards the stored size.

  Creates or updates the object with the given ``key`` to have the specified
  metadata and contents.


.. py:method:: OSBucket.write_structured(key: string, data: unknown, metadata: {[key: string]: unknown})
  :async:

  :param key: The unique key identifying this object in the bucket. Counts towards the stored size.
  :param entry: The object contents to store. Counts towards the stored size.
  :param metadata: An arbitrary mapping of information to associate with the object. Counts towards the stored size.

  A convenience for :py:meth:`write` when writing non-binary data. This requires
  less fields being provided and Kate will include additional metadata to identify
  the object as a JavaScript structure.


.. py:method:: OSBucket.create(key: string, entry: NewEntry)
  :async:

  :param key: The unique key identifying this object in the bucket. Counts towards the stored size.
  :param entry: The object to store. Counts towards the stored size.
  :raises EExists: if an object already exists with this key.

  Creates an object with the given ``key`` in the bucket, but fails if the
  key is already in use by another object.


.. py:method:: OSBucket.create_structured(key: string, data: unknown, metadata: {[key: string]: unknown})
  :async:

  :param key: The unique key identifying this object in the bucket. Counts towards the stored size.
  :param entry: The object contents to store. Counts towards the stored size.
  :param metadata: An arbitrary mapping of information to associate with the object. Counts towards the stored size.
  :raises EExists: if an object already exists with this key.

  A convenience for :py:meth:`create` when writing non-binary data. This requires
  less fields being provided and Kate will include additional metadata to identify
  the object as a JavaScript structure.

  Like :py:meth:`create`, this fails if there's already an object with the
  same key in the bucket.


.. py:method:: OSBucket.delete(key: string)
  :async:

  :param key: The unique key identifying the object to delete.
  :raises ENotFound: if there's no object with the given key in the bucket.
  
  Removes the object pointed by the given key in the bucket, and releases
  its previously used storage space. This will fail if there's no object
  with the given key.
