Bridges
=======

A bridge is a snippet of code injected in a web cartridge's process in order
to offer support for things that a web game expects through either static
code translation or dynamic emulation.

As a developer you pick which bridges your web game needs based on the features
it requires to run. The following bridges are available:

.. toctree::
  :caption: Web APIs
  :maxdepth: 1

  network-proxy
  input-proxy
  pointer-input-proxy
  local-storage-proxy
  indexeddb-proxy

.. toctree::
  :caption: Kate support
  :maxdepth: 1

  preserve-webgl-render
  capture-canvas

.. toctree::
  :caption: Game engine support
  :maxdepth: 1
  
  renpy-tweaks