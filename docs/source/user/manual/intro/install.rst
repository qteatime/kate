Installing
==========

You can install the Kate Emulator in almost every modern device that has
a modern web browser. You can also install the Kate Emulator natively on
Windows and Linux (including Steam OS and Chrome OS). MacOS support will
come soon.

The Web version can be installed as a Web Application on supported
browsers: Chrome (desktop and Android), Safari (iOS), and Edge (Windows 10+).
Installing the web application will allow you to run Kate offline, but you'll
have less integration with the underlying device.

The currently recommended installation options are, in order:

* :ref:`Web application` (available on Windows, Linux, Chrome OS, Steam OS, Android);
* :ref:`Native application` (available on Windows and Linux);


.. _Web Application:

Web Application
---------------

If you just want to try Kate out, the developers maintain a public version
of the application that you can access on any device. Just open
https://kate.qteati.me/ on your browser.

Note that, for security and debugging purposes, all accesses to the public
instance are logged (including IP addresses and similar information your
device sends to the server when connecting). This information is retained
for the time needed to address security and debugging issues.

The public instance has plans for maintenance for at least until 2028.


Running your own Kate instance
""""""""""""""""""""""""""""""

Rather than depending on the public instance, you can run your own private
Kate instance on any server. To do so, please download the ``kate-www.zip``
file from the
`Kate Releases page on GitHub <https://github.com/qteatime/kate/releases>`_,
then put this file in your server.

If you don't know how to run a web server, or would rather not manage a
server on your own, but still want the added control and privacy of having
your own Kate instance, services like Netlify or Digital Ocean's App Platform
will let you upload the zip file above and get a managed server. Be sure to
check their usage prices and compare before you sign up for anything.
Other similar managed services exist elsewhere.

.. important::

   Kate **must absolutely be served over HTTPS, with a valid SSL certificate**.
   Again, managed services will handle this for you automatically,
   but if you're running your own server you'll need to configure a proper
   HTTPS connection, as most of the browser APIs that Kate relies are not
   available over unencrypted HTTP.


Installing as a PWA
"""""""""""""""""""

You can install any web instance of Kate as a
`Progressive Web App (PWA) <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps>`_.
This will allow you to run Kate even when you're not connected to the internet,
as all files and data needed are installed locally on your device. This is
the only option to have an offline experience in mobile phones.

To install Kate as a PWA you first access your Kate instance on a supported
browser and operating system, then:

* On **Windows 10+**: open the page in Microsoft Edge, then choose 
  ``Apps -> Install site as an app`` from the menu;
* On **Android**: open the page in Google Chrome, then choose ``Install app``
  from the menu;
* On **Chrome for Windows/Linux**: you'll find the ``Install`` button in the
  address bar.

You might also be prompted to install the page as an App when you first visit it.

Web applications on Steam Deck
""""""""""""""""""""""""""""""

If you run Chrome on Steam Deck you'll be able to install Kate as an App, and
then have it added to your Steam library as a "non-steam game". This allows
you to access Kate directly from Steam's gaming mode, and consequently play
any Kate game from there as well.

However, Chrome runs using `Flatpak <https://flatpak.org/>`_ by default, and
the default sandbox configuration is a bit too restrictive for running Kate
properly. Enabling Kate in Steam Deck's gaming mode thus takes a little bit
of effort and some being comfortable with running commands in the command line.
All of the configuration below has to be done in the Deck's desktop mode.

.. note::
  
  Though this mentions Chrome, the same goes for Firefox or Microsoft Edge if
  they're running as a Flatpak. You'll need to replace the ``com.google.Chrome``
  parts with the unique id of another browser (e.g.: ``com.microsoft.Edge``).

**Allow Chrome to create application configurations for installed PWAs:**
  By default Chrome ships with little file system access, which is a good
  default, but that default also prevents you from having application
  shortcuts for installed PWAs created directly.

  To address this you can either give Chrome access to write files in the
  `~/.local/share/applications` and `~/.local/share/icons` directories:

  ```shell
  $ flatpak override --user --filesystem=~/.local/share/applications:create com.google.Chrome
  $ flatpak override --user --filesystem=~/.local/share/icons:create com.google.Chrome
  ```

  Or you can create the ``.desktop`` file for your PWA manually in
  ``~/.local/share/applications``. For example, creating a ``Kate.desktop``
  file in that folder with a text editor, you can have it look like the
  following:

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

  The additional ``--start-fullscreen`` and ``--no-default-browser-check`` are
  optional, but you'll usually want to run Kate in fullscreen on the Deck.

**Allow Chrome to read the Steam gamepad input (and other devices):**
  By default Chrome will not have access to read gamepad input because it
  interacts with gamepads through `udev <https://en.wikipedia.org/wiki/Udev>`_
  and the flatpak does not grant access to it on the basis that the API is
  not stable.

  Since Steam Deck is a fairly specific device with a fairly specific OS,
  you can give Chrome read-only access to it to get the gamepad working.

  ```shell
  $ flatpak --override --user --filesystem=/run/udev:ro com.google.Chrome
  ```

**Add Kate to your library as a non-Steam game:**
  To launch Kate from the Deck's gaming mode you'll need to add it to your
  Steam library as a non-Steam game. To do so open the Steam client in
  desktop mode, then in the bottom left click "Add a Game", and select
  "Add a Non-Steam Game".

  From the list that opens search for `Kate` (or the name you gave it if
  you wrote your own ``.desktop`` file), check the checkbox beside the name,
  and click "Add selected Programs".

  That's it, you can go back to gaming mode.

**Make sure you can control Kate properly:**
  When you first launch Kate it'll likely be in handheld mode. First, make
  sure the controller layout for Kate is set to ``Gamepad with Mouse Trackpad``,
  as otherwise you won't be able to use the pointer input some games
  (e.g.: Ren'Py visual novels) rely on.

  Also note that if you haven't given the browser access to udev you'll need
  to configure your own layout that sends keyboard input to Kate instead.
  Even if you use Steam's built-in template, it might be useful to assign
  some of the back buttons to ``Enter`` and ``Escape`` because the Deck's
  file picker is a bit annoying to use with the trackpad.

  Once you can control Kate with the Steam gamepad, press |btn_berry_text|
  (the menu button on the right of the Deck), then select
  ``Settings -> User Interface`` and switch to Fullscreen Mode.

  You might also want to swap |btn_ok| and |btn_cancel| in
  ``Settings -> Controller & Sensors -> Control Kate with a standard gamepad ->
  Configure standard mapping``. By default you confirm things in Kate with
  the ``B`` button on the deck, and cancel with ``A``, but Steam OS uses the
  opposite configuration out of the box.


Caveats
"""""""

Using the public Kate instance is practical, but depends on a website that
is external to your device. As such, it's not the recommended option for
video game archival.

The security properties depend on the domain it uses (``kate.qteati.me``)
taking you to the same computer for ever. Since the authors of Kate are
neither immortal nor immune to financial problems, it's less clear if they
would still own and maintain the domain after 5 years.

In the less bad scenario, the domain is not renewed, and the Kate emulator
stops working as soon as you clear the cached files. In the worse scenario,
a domain takeover (where e.g.: someone else buys the domain and routes it
to a different computer) would allow the attacker to have access to all
information locally stored in Kate in your device, and any additional
permissions you've granted the domain; this poses a significant risk,
but the risk applies to web sites in general.


.. _Native application:

Native application
------------------

Kate can run as a native application by using
`Electron <https://www.electronjs.org/>`_. These releases are currently
**unsandboxed and unsigned**. This means that they will have fairly wide
access to your device and will trigger a warning about the lack of code
signature.

`Pre-built versions of Kate are released on GitHub`_. You'll
need to download the right compressed archive for your OS and
`CPU architecture`_, then extract it somewhere in your computer. After that
you'll be able to run the Kate emulator from the provided executable.

You can also `build Kate from source`_ yourself.

.. _Pre-built versions of Kate are released on GitHub: https://github.com/qteatime/kate/releases


Windows 10 (or more recent)
"""""""""""""""""""""""""""

1. Download one of the following:

   - ``kate-win32-x64.zip`` — for Intel/AMD 64-bit processors (e.g.: Intel i7);
   - ``kate-win32-arm64.zip`` — for ARM 64-bit processors (e.g.: Microsoft SQ1);

2. Extract the zip somewhere in your computer;

   - You can right-click the file and choose ``Extract all...``;

3. Run ``Kate.exe``;

.. note::

   Windows 8 and earlier are not officially supported, however you can try
   `Building from source`_ yourself.


Linux (including SteamOS and Raspberry Pi)
""""""""""""""""""""""""""""""""""""""""""

1. Download one of the following:

   - ``kate-linux-x64.tar.gz`` — for Intel/AMD 64-bit processors (e.g.: Intel i7, Steam Deck);
   - ``kate-linux-armv7l.tar.gz`` — for ARMv7 32-bit processors (e.g.: Raspberry Pi 3);
   - ``kate-linux-arm64.tar.gz`` — for ARM 64-bit processors (e.g.: Raspberry Pi 4 and 5);

2. Extract the file somewhere in your computer;

   - You can run something like ``tar -xzf kate-linux-x64.tar.gz`` in the terminal;

3. Run ``kate``;


.. _CPU architecture:

How do I know what's my CPU architecture?
"""""""""""""""""""""""""""""""""""""""""

Your CPU architecture will likely match your OS architecture. On Windows
you can check your OS architecture by going to ``Settings -> System -> About``,
then checking your ``System type`` in the device specifications. On Linux you
can run ``uname -m`` in the terminal.

For Kate's purposes, ``x86_64`` and ``x64`` are the same thing. If you see
``x86_64``, it means you have an Intel-compatible 64-bit processor, and should
download the ``x64`` version of Kate.

Another way of checking your processor's architecture is to open
https://kate.qteati.me/ in a Chromium-based browser (Chrome, Opera, Edge,
Brave, etc.), press |btn_berry_text|, then select ``About Kate``.
Your processor architecture should be listed under ``Host -> Architecture``.


.. _pre-built caveats:

Caveats of pre-built binaries
"""""""""""""""""""""""""""""

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
significant damage to your computer. One goal of the stable release is to have
the OS sandbox the whole native binary to avoid this, but we're not there yet.

Kate itself and all cartridges are sandboxed using `Chromium's sandbox`_,
so in the event that Kate is compromised, or you run a malicious cartridge,
there is likely little damage they can do to your computer.

.. _code-signed: https://en.wikipedia.org/wiki/Code_signing
.. _chromium's sandbox: https://chromium.googlesource.com/chromium/src/+/HEAD/docs/design/sandbox.md


.. _build kate from source:
.. _building from source:

Building from source
""""""""""""""""""""

Building Kate from source allows you to audit the code and have more
assurance about the provenance of all its components. To compile Kate
you'll need to have `Node.js 18 or more recent`_ installed.

.. _node.js 18 or more recent: https://nodejs.org/en


Bootstrapping
'''''''''''''

Before you can build Kate you'll need to prepare your environment and
download the applications it depends on to build. This can be done
automatically by running the included bootstrap script:

.. code-block:: shell

   $ node support/bootstrap.js --npm-install --download-electron --unzip-electron --build

You'll need ``Extract-Archive`` on Windows' PowerShell, or ``unzip`` on
MacOS/Linux for this to work.

To bootstrap manually, you'll need the ``glob`` and ``typescript`` packages
for Node.js, and you'll need Electron 26.3.0. You can download the right
``electron-*.zip`` for your OS/architecture from the
`Electron releases page`_, then extract it to the ``electron/`` directory.

.. _Electron releases page: https://github.com/electron/electron/releases/tag/v26.3.0

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
"""""""""""

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
| Chrome for Android | 108+              | Android 9, Android 13            |
+--------------------+-------------------+----------------------------------+

Safari on iOS is not currently supported, and Safari on MacOS is not currently
tested. Once the missing features are implemented in Safari, these will be
added to the table above as well.

Installing the web app works in the following device/OSs:

* **Android**: only with Chrome for Android;
* **Windows 10+**: only with Microsoft Edge;
* **Chrome (Desktop)**: supported on Windows and Linux;


Native version
""""""""""""""

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

Pre-built binaries do not work on Windows 8 and earlier because Google has
stopped supporting those versions in Chromium.