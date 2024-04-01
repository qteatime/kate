RPG Maker MV
============

Games made with `RPG Maker MV <https://www.rpgmakerweb.com/products/rpg-maker-mv>`_
can run on Kate when using the web export option.

.. important::
  The recipe only covers the default RPG Maker MV configuration. If you're
  using plugins, you'll likely need to specify any additional APIs they
  require manually.


Kart configuration
------------------

The minimal configuration for a RPG Maker MV game looks like this:

.. code-block:: json

  {
    "id": "my-namespace/my-game",
    "root": "www",
    "version": {"major": 1, "minor": 0},
    "metadata": {
      "presentation": {
        "author": "Me",
        "title": "My Game",
        "tagline": "A RPG Maker MV game"
      }
    },
    "platform": {
      "type": "web-archive",
      "html": "index.html",
      "recipe": {
        "type": "rpg-maker-mv",
        "pointer_support": true,
        "hide_cursor": false
      }
    }
  }

This assumes that you're placing your ``kate.json`` configuration outside
of the ``www`` folder that the export generates.


Bridges used
------------

This recipe includes the following bridges:

.. code-block::

  {
    "bridges": [
      { "type": "network-proxy", "sync_access": ["js/plugins/*.js", "img/tilesets/*.png"] },
      { "type": "keyboard-input-proxy-v2", "mapping": "defaults", "selector": "document" },
      { "type": "pointer-input-proxy", "selector": "#GameCanvas", "hide_cursor": false },
      { "type": "capture-canvas", "selector": "#GameCanvas" },
      { "type": "preserve-webgl-render" },
      { "type": "local-storage-proxy" }
    ]
  }

The ``point-input-proxy`` depends on whether you've enabled ``pointer_support``
in your recipe configuration or not. If your game uses other features and APIs,
you might need to specify additional bridges in the ``platform`` section,
as usual; those will take precedence over the default recipe configuration.


Included files
--------------

By default the recipe will include all files that are generated for a
default RPG Maker MV project. If you need other files, you'll have to include
them in the ``files`` section manually.

The default file patterns are:

.. code-block::

  {
    "files": [
      "**/*.html",
      "**/*.json",
      "**/*.ogg",
      "**/*.css",
      "**/*.ttf",
      "**/*.png",
      "**/*.txt",
      "**/*.js"
    ]
  }

Note that this does not include the `*.m4a` files which RPG Maker has for
Apple devices. That would double the size of the cartridge and increase
significantly the time required to install it. Kate will support decoding
of OGG sound files on Apple devices in the future natively, so there's no
need to add proprietary formats.


Resolution
----------

Kate's native resolution is 800x480 on physical devices (and the handheld
mode in the emulator), this means that ideally you'll have your game fit
the 800x480 resolution as well. The easiest way of achieving this is to
enable the ``Community_Basic`` plugin and specify the ``screenWidth`` and
``screenHeight`` to match Kate's native resolution.