#K0005 — Partitioned File Storage
=================================

:Author: Q\.
:Started: 2023-12-08
:Last updated: 2023-12-08
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
  }

  interface Partition {
    get(id: BucketId): Promise<Bucket>;
    create(): Promise<Bucket>;
    release(bucket: Bucket): void;
    release_persistent(key: PersistentKey): void;
    persist(bucket: Bucket): PersistentKey;
  }

  interface Bucket {
    put(data: ArrayBuffer): Promise<FileId>;
    read(id: FileId): ArrayBuffer;
    delete(id: FileId): void;
  }

Note the lack of explicit deletion for buckets: they're garbage collected
automatically once there are no more references to it!

