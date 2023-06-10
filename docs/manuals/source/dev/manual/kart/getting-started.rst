Getting started
===============

To package a cartridge you'll need a Kart configuration file, commonly named
``kate.json``. This file tells Kart what your cartridge is about, what
files to include in your cartridge, and how Kate should run this cartridge
once it's installed.


Minimal configuration
---------------------

Let's consider the `Kat'chu <https://github.com/qteatime/kate/tree/main/examples/katchu>`
example game included with Kate. A minimal configuration file for it looks like
the following:

.. code-block:: json

  {
    "id": "qteati.me/katchu",
    "metadata": {
      "game": {
        "author": "Q.",
        "title": "Kat'chu",
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
composed from a domain name you have (e.g.: ``my-name.itch.io``) and a
unique name for your game. It follows a specific format described in the
:ref:`Cartridge Identification` section.

Then it includes some ``metadata``. Kate has a lot of metadata fields that
are used to display the cartridge to the player and allow them to organise
and search their library (and the upcoming stores). You should provide at
least ``title`` and ``thumbnail``, as these are used everywhere
the cartridge is displayed.

The ``files`` section includes a list of :term:`glob patterns` that match
files that will be included in the cartridge (and thus usable when running
the game). Here the game includes ``.html``, ``.js``, ``.css``, ``.png``,
and ``.wav`` files.

Finally, the ``platform`` section describes how to run the cartridge. Here
the game uses the ``web-archive`` runtime and points to ``www/index.html``
as the page that should be loaded when running the cartridge.


Making a cartridge
------------------

To make a cartridge you run the ``kart`` application in the command line,
providing the configuration file and a name for the cartridge. For example,
if you run it from the same folder as your ``kate.json`` file:

.. code-block:: shell

  $ kart kate.json --output katchu.kart

This should create a ``katchu.kart`` cartridge in the current directory,
which you can then share for people to install in a Kate emulator.

.. important::

   If you're using PowerShell on Windows 10+, depending on your security
   settings, you might see a message like the following:

       kart : File ``C:\<...>\kart.ps1`` cannot be loaded because running
       scripts is disabled on this system. For more information, see
       about_Execution_Policies at ``https://...``

   PowerShell has more restricted rules on script execution, and the Kate
   tools are not signed. You are encouraged to
   `review the code on GitHub <https://github.com/qteatime/kate/tree/main/packages/kate-tools>`_
   and at the location Windows is pointing you to, if you've installed it
   through `npm <https://www.npmjs.com/>`_.

   Rather than disabling PowerShell's security rules, you *may* choose
   to run ``kart.cmd`` instead of ``kart`` as a work-around. CMD files
   are not covered by the same security rules.

   Once again, **you are encouraged to review your tools' code**. These
   security rules exist for a reason, and arbitrarily running applications
   in an unsandboxed system, like Windows, can easily get your computer
   compromised or damaged (or risk your reputation by shipping malware
   to your players). Kate is a secure platform, but part of that security
   comes from knowing what your applications are doing.
