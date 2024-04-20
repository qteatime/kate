Getting started
===============

To package a cartridge you'll need a Kate build configuration file, commonly
named ``kate.json``. This file tells the cartridge packaging tool what your
cartridge is about, what files to include in your cartridge, and how Kate
should run this cartridge once it's installed.


Minimal configuration
---------------------

Let's consider the `Kat'chu <https://github.com/qteatime/kate/tree/main/examples/katchu>`_
example game included with Kate. A minimal configuration file for it looks like
the following:

.. code-block:: json

  {
    "id": "qteati.me/katchu",
    "version": {"major": 1, "minor": 0},
    "metadata": {
      "presentation": {
        "author": "Niini",
        "title": "Kat'chu",
        "tagline": "Collect consoles and rack up scores",
        "thumbnail_path": "thumbnail.png"
      }
    },
    "files": [
      "**/*.html",
      "**/*.css",
      "**/*.js",
      "**/*.png",
      "**/*.wav"
    ],
    "platform": {
      "type": "web-archive",
      "html": "www/index.html"
    }
  }

Here the ``id`` field is a unique identifier for your cartridge. This is
composed from a domain name you have (here that's ``qteati.me``, but it could
be ``my-name.itch.io``) and a unique name for your game.
It follows a specific format described in the
:ref:`Cartridge Identification` section.

A version must also be provided, and it needs to be updated every time the
contents of the cartridge change. If you publish different cartridges with
the same ``id`` and ``version`` number, when the player tries to install
it Kate will tell them there's nothing to do, because that cartridge is
already installed. Increasing the version number on updates is also important
if you want your game's save data to be properly copied to the new version,
since Kate stores save data for each cartridge version separately to allow
players to rollback safely if the upgrade causes issues in any way!

Then it includes some ``metadata``. Kate has a lot of metadata fields that
are used to display the cartridge to the player and allow them to organise
and search their library (and the upcoming catalog). You should provide at
least ``title`` and ``thumbnail``, as these are used everywhere
the cartridge is displayed.

The ``files`` section includes a list of :term:`glob patterns <glob pattern>` that match
files that will be included in the cartridge (and thus accessible when running
the game). Here the game includes ``.html``, ``.js``, ``.css``, ``.png``,
and ``.wav`` files in any of the game's folders.

Finally, the ``platform`` section describes how to run the cartridge. Here
the game uses the ``web-archive`` runtime and points to ``www/index.html``
as the page that should be loaded when running the cartridge.


Making a cartridge
------------------

To make a cartridge you use the Kate Publisher application. There's a separate
guide on :ref:`installing the Kate Publisher` cartridge, and the
:doc:`tutorial on making your first cartridge </dev/manual/intro/hello-world>`
describes how to use it.

You can also use the ``kart`` command line application to create Kate
cartridges, if you're automating your game's builds.