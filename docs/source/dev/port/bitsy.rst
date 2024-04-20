Bitsy
=====

Games made with `Bitsy <https://bitsy.org/>`_ can run on Kate with little
configuration. Games using bitsy hacks might not be supported.


Build configuration
-------------------

The minimal configuration for a Bitsy game looks like this:

.. code-block:: json

  {
    "id": "my-namespace/my-game",
    "version": {"major": 1, "minor": 0},
    "metadata": {
      "presentation": {
        "author": "Me",
        "title": "My Game",
        "tagline": "A bitsy game"
      }
    },
    "platform": {
      "type": "web-archive",
      "html": "my_game.html",
      "recipe": {
        "type": "bitsy"
      }
    }
  }

This assumes that your Bitsy game is stored in a file called ``my_game.html``.


Bridges used
------------

This recipe includes the following bridges:

.. code-block::

  {
    "bridges": [
      {"type": "keyboard-input-proxy-v2", "mapping": "kate", "selector": "document"},
      {"type": "capture-canvas", "selector": "#game"}
    ]
  }

This configuration is enough for Bitsy games in the default web export. If
you've modified the controls of the bitsy engine or the canvas it uses,
you'll need to reconfigure the bridges. You can do that by specifying
the bridges in the ``platform`` section as usual and they'll take
precedence over the configuration above.


Included files
--------------

By default the build configuration will only include HTML files. If your Bitsy game is not
self-contained and has additional files referenced from the HTML, you'll
need to manually include those on the cartridge configuration as well.

For example, a game that references PNG images and WAV music files could
have its file list looking like the following:

.. code-block::

  {
    ...,
    "files": [
      "**/*.wav",
      "**/*.png"
    ]
  }

This will include all ``.png`` files in any of the subdirectories, and
all ``.wav`` files in any of the subdirectories, so the game will be
able to reference them when loaded in Kate.


