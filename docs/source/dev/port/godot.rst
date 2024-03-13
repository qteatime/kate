Godot
=====

Games made with `Godot <https://godotengine.org/>`_ can run on Kate when
using the HTML5 export option.

.. important::
  Only games exported with Godot 3 are currently supported due to some
  requirements in games exported with Godot 4 that are disabled until some
  `outstanding security issues can be addressed <https://github.com/orgs/qteatime/discussions/1>`_.


Kart configuration
------------------

The minimal configuration for a Godot game looks like this:

.. code-block:: json

  {
    "id": "my-namespace/my-game",
    "version": {"major": 1, "minor": 0},
    "metadata": {
      "presentation": {
        "author": "Me",
        "title": "My Game",
        "tagline": "A godot game"
      }
    },
    "platform": {
      "type": "web-archive",
      "html": "my_game.html",
      "recipe": {
        "type": "godot",
        "version": "3",
        "pointer_support": true,
        "hide_cursor": false
      }
    }
  }

This assumes that you've exported your Godot game to a file called ``my_game.html``.


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
default Godot project. If you need other files, you'll have to include
them in the ``files`` section manually.

The default file patterns are:

.. code-block::

  {
    "files": [
      "**/*.html",
      "**/*.png",
      "**/*.js",
      "**/*.pck",
      "**/*.wasm"
    ]
  }