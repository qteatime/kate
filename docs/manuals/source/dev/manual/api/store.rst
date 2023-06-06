``store`` — Saving your state
=============================

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
described in the :doc:`Object Storage API design document </design/0101-object-storage>`.