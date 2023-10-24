Bitsy
=====

:Release status: **Early access**
:Available since: v0.6

`Bitsy <https://bitsy.org/>`_ is a small game engine for making small
pixel art adventure games. Games run natively on a web browser, distributed
as a HTML file that contains all data for the game, usually. Bitsy hacks
are extensions that are used by some games made in Bitsy and that may include
data stored outside of the HTML file (e.g.: music files).

To install a game made with Bitsy you can choose "Import from ZIP" and
give the Importer access to the ZIP file containing the game's HTML, as
well as any additional files it uses.

You'll have the chance of selecting a thumbnail for the cartridge and
correcting the title of the game if the Importer guessed it wrongly. Just
click the big "Install" button when you're happy with how it will look in
your library.


Game file expectations
----------------------

In order for the Importer to recognise a game as made with Bitsy it needs to
have an HTML file at the top-level of the ZIP file, and this HTML must contain
the Bitsy engine. The Importer checks for a ``BITSY VERSION`` in the file, as
well as scripts containing Bitsy game data.

The title suggested by the Importer is the same as the title in the HTML page.


How the game is repackaged
--------------------------

Bitsy games are already distributed as web games in general, so the Importer
makes no changes to the contents of the HTML file. It does add the necessary
:doc:`Bridges </dev/manual/web/bridges/index>` to make the web APIs it expects
available to the cartridge through emulation.


Controls
--------

Bitsy games use a D-pad-like set of buttons for moving the character around
by default. Interacting with elements is done by bumping into them. So imported
games can be controlled using only the |btn_dpad| in Kate.

Additionally Kate uses |btn_capture_text| to take a screenshot (press once),
or record video (hold for half second, hold again to stop recording). And
|btn_berry_text| to open Kate's context menu (which lets you close the
cartridge or view the screenshots/video captures you've taken).

These special keys are not forwarded to Bitsy.


Known limitations
-----------------

The Importer only really knows how to import games made with an unmodified
Bitsy engine. Many Bitsy games are released with "Bitsy hacks", which are
extensions to the engine that can take any form. While some of these
Bitsy hacks may work by chance, there are no guarantees from the Importer.

If you'd like to see a Bitsy hack specifically supported please
put forward a feature request on GitHub or the Kate community forum on Itch.io.

Also note that Bitsy games are generally released with a 512x512 resolution,
so they might be scaled down slightly when running Kate with a 800x480
resolution. Black bars will always be added around the game's screen to
avoid squishing or stretching the game to a different (non-square) aspect ratio.