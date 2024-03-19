GameMaker
=========

Games made with `GameMaker <https://gamemaker.io/en>`_ can run on Kate when
using the HTML5 export option.


Kart configuration
------------------

The minimal configuration for a GameMaker game looks like this:

.. code-block:: json

  {
    "id": "my-namespace/my-game",
    "version": {"major": 1, "minor": 0},
    "metadata": {
      "presentation": {
        "author": "Me",
        "title": "My Game",
        "tagline": "A GameMaker game"
      }
    },
    "platform": {
      "type": "web-archive",
      "html": "index.html",
      "recipe": {
        "type": "gamemaker",
        "pointer_support": true,
        "hide_cursor": false
      }
    }
  }


Bridges used
------------

This recipe includes the following bridges:

.. code-block::

  {
    "bridges": [
      { "type": "network-proxy", "sync_access": ["*.js"] },
      { "type": "keyboard-input-proxy-v2", "mapping": "defaults", "selector": "#canvas" },
      { "type": "pointer-input-proxy", "selector": "#canvas", "hide_cursor": false },
      { "type": "capture-canvas", "selector": "#canvas" },
      { "type": "preserve-webgl-render" }
    ]
  }

The ``point-input-proxy`` depends on whether you've enabled ``pointer_support``
in your recipe configuration or not. If your game uses other features and APIs,
you might need to specify additional bridges in the ``platform`` section,
as usual; those will take precedence over the default recipe configuration.


Included files
--------------

By default the recipe will include all files that are generated for a
default GameMaker project. If you need other files, you'll have to include
them in the ``files`` section manually.

The default file patterns are:

.. code-block::

  {
    "files": [
      "**/*.html",
      "**/*.ico",
      "**/*.ini",
      "**/*.js",
      "**/*.png",
      "**/*.ogg",
      "**/*.yy"
    ]
  }

Note that this does not include the `*.mp3` files which GameMaker duplicates
on export for Apple devices. That would double the size of the cartridge and
increase significantly the time required to install it. Kate will support
decoding of OGG sound files on Apple devices in the future natively, so
there's no need to add proprietary formats.