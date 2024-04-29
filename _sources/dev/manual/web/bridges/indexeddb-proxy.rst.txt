IndexedDB proxy
===============

If your game relies on `IndexedDB <https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API>`_ in order to persist data, this bridge
will allow it to work in Kate by converting IndexedDB operations to work on the
:py:mod:`Object Storage API <KateAPI.store>`. You need to choose whether you'll
use the versioned or unversioned partition when instantiating this bridge.


Using in your build configuration
---------------------------------

To add this bridge to your cartridge you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "indexeddb-proxy",
        "versioned": true
      }
    ]
  }

The ``versioned`` option defines whether the bridge will use the versioned
partition (where data is only stored for the current cartridge's version),
or if it'll use the unversioned partition, which is shared between all versions.

Note that IndexedDB is designed to support schema upgrades, but not schema
downgrades. Kate players expect *both* to work, so the disabling versioning
is only a good option if you can guarantee that your database version will never
change. Otherwise players will need to delete all their save data in order to
be able to downgrade your cartridge.


Dynamic emulation
-----------------

This bridge works by emulating the IndexedDB API dynamically. It replaces the
global ``indexedDB`` object with the bridge's own implementation of the API
on top of Kate's :py:mod:`Object Storage API <KateAPI.store>`.

However, there are problems you may hit with it. Because the IndexedDB API
is quite substantial and complex, this bridge only implements a subset of the
API that is more likely to be used by a video game. It has enough implemented
to work with Emscripten's IDBFS implementation (which powers e.g.: Ren'Py's
save data feature on the web export).

It also lacks any transactional guarantees and any optimised implementation
of indexing and searching (the implementation always performs a linear
search over the entire table). This makes the bridge a poor choice to
anything that needs to store and search tens of thousands of items, or
which needs concurrency and transactional guarantees.

.. note::

  If you have a use case that is not covered by the current proxy implementation
  of IndexedDB, please
  `open an issue on GitHub <https://github.com/qteatime/kate/issues>`_
  to discuss the specific scenarios you're looking at. A full implementation
  of the IndexedDB is very unlikely, but covering more common cases is
  desirable.