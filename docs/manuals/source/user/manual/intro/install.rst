Installing
==========

The recommended way of getting your hands on Kate is to use the web-based
emulator. This runs directly in your browser, no installation necessary:

  https://kate.qteati.me

To run the web-based emulator you'll need a modern browser. Kate supports
the latest versions of Chrome (desktop and Android), Edge, Opera, and Firefox.

If you want to run Kate offline, you'll need to install it. There are a
few different options to do so (ranked from most recommended to least
recommended):

* :ref:`Web Application` (available on Windows, Linux, Steam Deck, Android);
* :ref:`Pre-built binaries` (available on Linux and Windows);
* :ref:`Building from source` (available on Linux and Windows);

.. note::

   The web version should be compatible with other platforms with a modern
   browser, but these devices are not currently part of the testing pipeline.
   Once they are, they will be added here as officially supported as well.

   Safari on iOS is tested and known not to work with many of the features
   Kate provides, as those are not implemented in Safari yet (or have
   incompatible behaviour in Safari).


.. _Web Application:

Web Application
---------------

You can install the web version of the emulator (https://kate.qteati.me/)
in your device as a web app. This will allow you to run Kate without an
internet connection, and is the only option available on mobile phones.

To install:

* On **Windows 10+**: open the page in Microsoft Edge, then choose 
  ``Apps -> Install site as an app`` from the menu;
* On **Android**: open the page in Google Chrome, then choose ``Install app``
  from the menu;
* On **Chrome for Windows/Linux**: you'll find the ``Install`` button in the
  address bar.


Chrome on Steam Deck
''''''''''''''''''''

Chrome runs on the Steam Deck using `Flatpak <https://flatpak.org/>`_, which
adds an OS sandbox around it. This means that Chrome will not, by default,
have the necessary access to create the desktop shortcuts for Kate
(which you can then add as a "non-Steam game" from within Steam in
Desktop mode).

If you want to have a desktop shortcut you can either give Chrome access
to write to `~/.local/share/applications` and `~/.local/share/icons`. Or,
more conservatively, you can create the `.desktop` file yourself. Either way,
you'll probably want to run Kate in true fullscreen mode, which you can do by
making sure your `.desktop` file looks like this:

.. code-block::

   #!/usr/bin/env xdg-open
   [Desktop Entry]
   Version=1.0
   Terminal=false
   Type=Application
   Category=Game;
   Name=Kate
   Exec=flatpak run --command=/app/bin/chrome com.google.Chrome --profile-directory=Default --app=https://kate.qteati.me/ --start-fullscreen --no-default-browser-check
   TryExec=/var/lib/flatpak/exports/bin/com.google.Chrome


When you first run Kate, it'll launch in :doc:`Handheld case mode <modes>`. You
can hold down |btn_menu_text|, then go to ``Settings -> User interface`` and change
to fullscreen mode instead, since you can just use the physical Steam Deck
controller.


Caveats
'''''''

The web application option is practical, but depends on a website that
is external to your device. As such, it's not the recommended option for
video game archival.

The security properties depend on the domain it uses (``kate.qteati.me``)
taking you to the same computer for ever. Since the authors of Kate are
neither immortal nor immune to financial problems, it's less clear if they
would still own and maintain the domain in 5 years or longer.

In the less bad scenario, the domain is not renewed, and the Kate emulator
stops working as soon as you clear the cached files. In the worse scenario,
a domain takeover (where e.g.: someone else buys the domain and routes it
to a different computer) would allow the attacker to have access to all
information locally stored in Kate in your device, and any additional
permissions you've granted the domain; this poses a significant risk,
but the risk applies to web sites in general.

.. _Pre-built binaries:

Pre-built binaries
------------------

`Pre-built versions of Kate are released on GitHub`_. You'll
need to download the right compressed archive for your OS and
`CPU architecture`_, then extract it somewhere in your computer. After that
you'll be able to run the Kate emulator from the provided executable.

.. _Pre-built versions of Kate are released on GitHub: https://github.com/qteatime/kate/releases


Windows 10 (or more recent)
'''''''''''''''''''''''''''

1. Download one of the following:

   - ``kate-win32-x64.zip`` — for Intel/AMD 64-bit processors (e.g.: Intel i7);
   - ``kate-win32-arm64.zip`` — for ARM 64-bit processors (e.g.: Microsoft SQ1);

2. Extract the zip somewhere in your computer;

   - You can right-click the file and choose ``Extract all...``;

3. Run ``Kate.exe``;

.. note::

   Windows 8 and earlier are not officially supported, however you can try
   `Building from source`_ yourself.


Linux
'''''

1. Download one of the following:

   - ``kate-linux-x64.tar.gz`` — for Intel/AMD 64-bit processors (e.g.: Intel i7);
   - ``kate-linux-armv7l.tar.gz`` — for ARMv7 32-bit processors (e.g.: Raspberry Pi 3);
   - ``kate-linux-arm64.tar.gz`` — for ARM 64-bit processors (e.g.: Raspberry Pi 4);

2. Extract the file somewhere in your computer;

   - You can run something like ``tar -xzf kate-linux-x64.tar.gz`` in the terminal;

3. Run ``kate``;


.. _CPU architecture:

How do I know what's my CPU architecture?
'''''''''''''''''''''''''''''''''''''''''

Your CPU architecture will likely match your OS architecture. On Windows
you can check your OS architecture by going to ``Settings -> System -> About``,
then checking your ``System type`` in the device specifications. On Linux you
can run ``uname -m`` in the terminal.

For Kate's purposes, ``x86_64`` and ``x64`` are the same thing. If you see
``x86_64``, it means you have an Intel-compatible 64-bit processor, and should
download the ``x64`` version of Kate.

Another way of checking your processor's architecture is to open
https://kate.qteati.me/ in a Chromium-based browser (Chrome, Opera, Edge,
Brave, etc.), hold |btn_menu_text| for a second, then open ``About Kate``.
Your processor architecture should be listed under ``Host -> Architecture``.

.. _pre-built caveats:

Caveats
'''''''

The pre-built binaries are not `code-signed`_. This means that the OS cannot
verify where it came from, and modern Windows versions will warn you about
this.

The releases are generated with ``node make release:win:all`` and
``node make release:linux:all``. You can always try `building from source`_
yourself to be more assured of its provenance.

Pre-built binaries do not themselves run in a sandbox. This means that the
operating system will not restrict what the native binary can do, and will
instead grant it all permissions your user has. In the case Electron or
Chromium (the technologies that Kate uses) are compromised, they can cause
significant damage to your computer. One goal of stable release is to have
the OS sandbox the whole native binary to avoid this.

Kate itself and all cartridges are sandboxed using `Chromium's sandbox`_,
so in the event that Kate is compromised, or you run a malicious cartridge,
there is very little damage they can do to your computer.

.. _code-signed: https://en.wikipedia.org/wiki/Code_signing
.. _chromium's sandbox: https://chromium.googlesource.com/chromium/src/+/HEAD/docs/design/sandbox.md


.. _building from source:

Building from source
--------------------

Building Kate from source allows you to audit the code and have more
assurance about the provenance of all its components. To compile Kate
you'll need to have `Node.js 18 or more recent`_ installed.

.. _node.js 18 or more recent: https://nodejs.org/en


Bootstrapping
'''''''''''''

Before you can build Kate, you'll need to prepare your environment and
download the applications it depends on to build. This can be done
automatically by running the included bootstrap script:

.. code-block:: shell

   $ node support/bootstrap.js --npm-install --download-electron --unzip-electron --build

You'll need ``Extract-Archive`` on Windows' PowerShell, or ``unzip`` on
MacOS/Linux for this to work.

To bootstrap manually, you'll need the ``glob`` and ``typescript`` packages
for Node.js, and you'll need Electron 24.1.2. You can download the right
``electron-*.zip`` for your OS/architecture from the
`Electron releases page`_, then extract it to the ``electron/`` directory.

.. _Electron releases page: https://github.com/electron/electron/releases/tag/v24.1.2

Note that some sub-packages also have dependencies that need to be installed.
See the ``dependencies`` task in ``make.js`` for what to do if you want to
avoid any network requests.


Building Kate
'''''''''''''

After setting up, you can run ``node make all`` to build all Kate components:

.. code-block:: shell

   $ node make all

This will give you a working Kate emulator. You can try it by either running
``node make desktop:run`` (to run it as an Electron app), or starting a
server on the ``www/`` folder and pointing a modern browser there.

You should see a screen similar to the screenshot below. Download the
``example-cartridges.zip`` file from the `Kate releases page`_, extract it,
then drag-and-drop any of the ``.kart`` files over the console to install.
Open the cartridge to check if you can play cartridges correctly.

.. _kate releases page: https://github.com/qteatime/kate/releases

Generating native builds
''''''''''''''''''''''''

Under Windows you can run the following to generate a Kate release:

.. code-block:: shell

   $ node make release:win:x64

Under Linux you can run the following to generate a Kate release:

.. code-block:: shell

   $ node make release:linux:x64

Both of these will download Electron from the `Electron releases page`_ on
GitHub. If you'd rather do that manually, either download the zip file or
compile Electron from source yourself, then place the zip in the ``.cache``
folder, with the same name as the one in the releases page.


Caveats
'''''''

The same caveats as with the :ref:`pre-built binaries <pre-built caveats>`
applies. Electron in itself is unsandboxed, only the Kate kernel and
cartridge processes run inside of a sandbox.


Compatibility matrix
--------------------

Web version
'''''''''''

We aim to support the latest version of all mainstream browsers. The
web version of Kate has been tested and runs on the following browsers:

+--------------------+-------------------+----------------------------------+
| Browser            | Version supported | Device/OS tested                 |
+====================+===================+==================================+
| Microsoft Edge     | 110+              | Windows 10 x64, Windows 11 x64   |
+--------------------+-------------------+----------------------------------+
| Google Chrome      | 110+              | Windows 11 x64, Ubuntu 20.04 x64 |
+--------------------+-------------------+----------------------------------+
| Firefox            | 110+              | Windows 11 x64                   |
+--------------------+-------------------+----------------------------------+
| Opera              | 96+               | Windows 11 x64                   |
+--------------------+-------------------+----------------------------------+
| Chrome for Android | 108+              | Android 9                        |
+--------------------+-------------------+----------------------------------+

Safari on iOS is not currently supported, and Safari on MacOS is not currently
tested. Once the missing features are implemented in Safari, these will be
added to the table above as well.

Installing the web app works in the following device/OSs:

* **Android**: only with Chrome for Android;
* **Windows 10+**: only with Microsoft Edge;
* **Chrome (Desktop)**: supported on Windows and Linux;


Native version
''''''''''''''

The native version works on Windows 10+ (x64 and ARM64 architectures),
and on Linux (x64, ARM64, and ARMv7L). It should work on MacOS (x64 and ARM64)
as well, but it's not tested and there are no pre-built binaries provided
yet for it.

Testing of the native version has been done on the following operating systems:

* Windows:

  * Windows 10 (x64);
  * Windows 11 (x64);

* Linux:

  * Ubuntu 20.04 (x64);
  * Raspbery Pi OS (based on Debian 11) (ARMv7L, ARM64);
  * SteamOS (x64);

Pre-built binaries do not work on Windows 8 and earlier because Google has
stopped supporting those versions in Chromium.