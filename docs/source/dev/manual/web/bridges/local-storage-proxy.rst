Local storage proxy
===================

The local storage proxy provides the same API as the browser's storage API
(``localStorage`` and ``sessionStorage``), but persists the data using the
:py:mod:`Object Storage API <KateAPI.store>`.

There's no configuration for this bridge. It has only one behaviour.


Using in Kart
-------------

To add this bridge to your cartridge, you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "local-storage-proxy"
      }
    ]
  }


API emulation
-------------

This bridge works by replacing the global ``localStorage`` and ``sessionStorage``
objects with the bridge's own implementation. It relies on JavaScript's
:ref:`Proxy` to handle cases where these global objects are directly mutated
by the code.

That is, the following idiom is supported by this bridge:

.. code-block:: javascript

  localStorage.version = "1.0";
  localStorage.name = "nina";

Just like every other piece of data stored using the :py:mod:`KateAPI.store`
API, all data in the local storage proxied by this bridge counts towards the
cartridge's storage quota. SessionStorage is however not persisted and maintains
its in-memory-only behaviour from the specification.

The bridge will also make sure to serialise all values set through this API to
strings to maintain the same behaviour of the storage specification.


Multi-process and broadcasting
------------------------------

The specification for web storage allows broadcasting of changes to separate
processes of the same origin. That is, if a user opens two separate tabs
of the same website, then data written to the local or session storage of
one of the tabs is broadcast to the second tab through a storage event.

Kate does not allow multiple copies of a cartridge's process to run, therefore
there's no implementation of broadcasting. Separate instances of Kate running
is not a supported mode for the emulator either, and will lead to corruption
of the Kate's database.


Storage consistency
-------------------

The web storage API is specified to be synchronous. Everything you do has
an immediate effect on the underlying storage (although the storage
consistency itself is not specified). In Kate, cartridge do not have
direct access to any storage, and all calls towards :py:mod:`KateAPI.store`
are asynchronous by nature, since they're handled by a separate process.

To provide a synchronous API, Kate loads the contents of the local storage
before starting the cartridge's process, and does all modifications in memory.
There's then a delayed job queue running in the cartridge's process which will
use the :py:mod:`KateAPI.store` API to synchronise this state with the
underlying persistent storage. This means that the bridge can make fewer
durability guarantees.

While the bridge should just work most of the time, there may be particularly
complicated edge cases where you make a change to the local storage, but the
cartridge crashes before it manages to send the change to the persistent
storage. In this case the change will not be persisted, but previous data
will not be corrupted either—all writes are guaranteed to be atomic.