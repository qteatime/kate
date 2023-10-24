Ren'Py
======

:Release status: **Early access**
:Available since: v0.6

`Ren'Py <https://www.renpy.org/>`_ is a popular engine for making visual
novels. It's Python-based, but has added some support for exporting games
for running in a web browser --- still in beta. The Importer is able to
take a game released only for PC (Windows or Linux), and repackage it using
Ren'Py's own web runtime. That repackaged game can then run natively in Kate.

To install a game made with Ren'Py you can choose "Import from ZIP" and
give the Importer access to the ZIP file containing the game release.
This is generally the exact ZIP file you've downloaded (e.g.: from Itch.io).

You'll have the chance of selecting a thumbnail for the cartridge and
correcting the title of the game if the Importer guessed it wrongly. Just
click the big "Install" button when you're happy with how it will look in
your library.


Game file expectations
----------------------

In order for the Importer to be able to recognise a game as made with
Ren'Py (and thus use the Ren'Py Importer strategy), the ZIP file for
the release must follow a few rules:

* It must have a ``renpy`` and a ``game`` folder either at the top level
  of the ZIP file, or under exactly one folder. That is, if the ZIP has
  a structure like the following::

      + target-game-v1.0/
      |
      `--+ renpy/
         | 
         + game/
         |
         ...

  It'll be recognised by the importer. But if the ``target-game-v1.0`` folder
  isn't there the importer will still recognise it.

* The ``renpy`` folder must contain a proper ``renpy`` runtime package. The
  importer expects to find at least a ``__init__.py`` file there. This should
  always be the case for any releases generated directly by the Ren'Py launcher.

* The game must have been released with the version 7 or 8 of Ren'Py. The
  Importer will give you the option to try repackaging games released with
  the version 6 of Ren'Py using the version 7 runtime, but there are no
  guarantees this will work. Any other versions will be rejected.

* Not a hard rule, but if the released game includes the Ren'Py source code
  then the Importer will read the title of the game from the
  ``game/options.rpy`` file, or fall-back to the name of the ``.exe`` or
  ``.sh`` file. You can always override this in the review screen.


How the game is repackaged
--------------------------

Once you choose to install the game, the Importer will replace the original
``renpy`` folder (which contains the Windows or Linux runtime for Ren'Py)
with a new ``renpy`` folder containing the Ren'Py web runtime for the
appropriate version. The Importer uses the latest ``7.x`` or the latest
``8.x`` version of Ren'Py web. So if, for example, you import a game released
with Ren'Py ``8.0``, the Importer will use Ren'Py web at version ``8.1``.

Ren'Py tends to have a very stable documented API, so most games should run
fine when the version of the engine is upgraded. However if the game you're
trying to import has custom patches on the Ren'Py engine or uses internal,
undocumented features, it's more at risk of not working with the Importer.

The Importer also does a few additional transformations to files as needed
by the Ren'Py web runtime, such as packaging source code in a ZIP file and
generating "remote file placeholders". This is the same process that the
Ren'Py launcher uses to generate a web release of a Ren'Py game.

All these changes to files happen only to the data within the Importer itself;
your original ZIP files will not be modified.


Controls
--------

When a Ren'Py game is repackaged for Kate it will only be able to use
Kate's own controls, so if a game requires special mouse buttons or
specific keyboard buttons to be pressed, it might not work very well.

All games imported through the Importer will use the following control
scheme:

=============== ========== ===========================================
Kate button     Keyboard   Ren'Py action
=============== ========== ===========================================
|btn_dpad|      Arrow keys Move the focus
|btn_menu|      Left Shift (unused by Ren'Py in general)
|btn_ok|        Enter      Confirm selection, progress dialogue
|btn_cancel|    Escape     Cancel selection, open game menu
|btn_sparkle|   H          Hide the text box/other interface elements
|btn_l|         Page Up    Rollback, previous page
|btn_r|         Left Ctrl  Skip while holding
=============== ========== ===========================================

Additionally Kate uses |btn_capture_text| to take a screenshot (press once),
or record video (hold for half second, hold again to stop recording). And
|btn_berry_text| to open Kate's context menu (which lets you close the
cartridge or view the screenshots/video captures you've taken).

These special keys are not forwarded to Ren'Py.

Imported Ren'Py games also have pointer and touchscreen support. You can
use a mouse, touchscreen, stylus, trackpad, or other pointing device to
interact directly with the elements on the screen, like you would in
Ren'Py on PC. However, the following limitations apply:

* Kate only distinguishes between the "primary button"
  (e.g.: the left mouse button or pressing the stylus tip against the screen)
  and the "alternate button" (which is, in this case, every other button in
  the pointing device --- e.g.: middle and right mouse buttons would count
  as the same button in Kate). A Ren'Py game that depends on specific
  alternate buttons may not be fully playable.

* Kate does not support mouse wheel events. A Ren'Py game that depends on
  a mouse wheel may not be fully playable. Mouse wheels are generally used
  in viewports, and there you can generally use the scrollbars directly.


Known limitations
-----------------

The Ren'Py Importer uses the Ren'Py web runtime to play Ren'Py games in
Kate, so games imported this way are subject to the same limitations as
Ren'Py web currently have. Ren'Py's documentation has a page on the
`current limitations of Ren'Py web <https://www.renpy.org/doc/html/web.html#limitations>`_.

However there are a few specific limitations imposed by Kate:

* Games requiring access to specific keyboard key presses or other input
  devices will not work in Kate. See the `Controls`_ section for details.

* Games released with a version earlier than ``7.0`` cannot be properly
  imported, as Ren'Py web was introduced in the 7.x branch of Ren'Py.
  Additionally, the importer uses a static version of the Ren'Py web
  runtime, and custom patches to the Ren'Py engine or uses of undocumented
  features in a game might also cause it to not be supported by the Importer.

* Games that require access to OS services (e.g.: linking with Steam), or
  that make network calls (e.g.: checking for DLCs) cannot be supported in
  Kate :doc:`due to how the Kate sandbox works </user/manual/security/sandboxing>`.
  There are no plans to support these currently as supporting them in a way
  that aligns with Kate's security goals is complicated.


Known issues
------------

The Ren'Py Importer is currently in **early-access**, and as such there are
a few issues that are known but planned to be improved in future versions.

* Games that use text input (e.g.: providing a custom name for the MC) don't
  work in Kate yet because arbitrary keyboard input is not yet implemented.
  You should be able to accept the default name if the developer included one.

* Kate needs to keep all game files **in memory** during cartridge analysis,
  perparation, and installation. This means that particularly large games
  (e.g.: more than 1GB decompressed) may exhaust all memory available for
  Kate and crash the console. If you're running Kate in a browser, tabs
  have a much smaller RAM limit than your available RAM, too. This will be
  fixed in the next Kate release.

* Voice files might not play correctly, or at all. Especially with games
  released with older versions of Ren'Py (e.g.: 6.x).

* Ren'Py's fullscreen mode does not resize the game graphics to fit the
  available screen, and that means it's not really usable in Kate for most
  games --- Kate has a 800x480 or 1200x720 resolution.

* Some games use ``reload_all()`` to restart the game after doing some
  configuration (e.g.: to select the language). This is not supported in
  mobile Ren'Py or Ren'Py web, so games calling this function may look
  like they're frozen. You might have some luck closing the game and
  relaunching it.



