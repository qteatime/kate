Basics of porting
=================

The ``web-archive`` :term:`runtime` supports running games originally
made for a web browser in Kate by using a combination of :term:`emulation` and
:term:`code translation`, as long as all the data required to run the
game can be found in the cartridge.

A game using the ``web-archive`` runtime must provide at least one
:term:`HTML` page for Kate to load when the player runs the cartridge.
From there Kate figures out how to run the rest of the game. The rest
of this page describes all these processes in details.


Kate vs. the web
----------------

Web games are not much different from a regular web site. You use your
browser to navigate to some location on the internet, say
``https://www.example.com/my-cute-game``, your browser asks the server
at the end of this address for the contents it needs to load, and
then proceeds to display the contents to you.

The contents are likely a :term:`HTML` page; a structured documentent
that contains text, and may contain code and other interactive elements.
Most HTML pages are not self-contained, but rather include references
to external resources within it. For example, a page that includes
images may do so using:

.. code-block:: html

  <img src="backgrounds/room.png">

From this piece of code the browser does not have enough information
to display the image itself. So it has to once again ask the server
for the contents of
``https://www.example.com/my-cute-game/backgrounds/room.png``. This
cycle repeats until the browser has finished loading all external
content referenced from the HTML page.

Not all external references are known from loading the page, however.
Games will often include code that, dynamically, decides to load
even more external content. Say, a game that features character
customisation might ask the server for the contents of
``https://www.example.com/my-cute-game/sprites/punk-shirt.png`` depending
on a particular clothing choice from the player.

This is incidentally why "save page as..." in the browser will most
likely not result in a playable game—the browser has no way of knowing
all the data the game will need in the future because it is only made
aware of them at the moment the player hits a certain point in the game.

Besides the need for a server to answer these requests for data, browsers
also heavily rely on the origin of an address (in this case the
``https://www.example.com`` part) for security. It would be quite terrible
if accessing the above game allowed it to see information stored by your
bank, or social network, or any other site, really.

Kate has neither of these things: there are no servers, and because there
are no servers, there are also no origins. Kate games must be fully
self-contained and work entirely offline. This disconnect means that
web games cannot run directly in Kate.

Instead of requiring you to rewrite your entire game to work in Kate,
however, we take a different approach: Kate tricks the HTML page included
in the cartridge to think it's running in a real web browser, with the
origin it thinks should be the right one. It does this by emulating
web APIs and using code translation.


Static code translation
-----------------------

When Kate loads the web page described by the cartridge as the game's
entry point it needs to do two things:

* Make sure the page has access to all :doc:`Kate APIs </dev/manual/api/index>`. If we don't do
  this then players wouldn't even be able to interact with the game, because
  the cartridge's screen never gets "real" focus.

* Handle any external resource referenced in the page. If we don't do this
  then the page cannot be correctly loaded, since it won't have anywhere to
  ask the data from (there are no servers involved).

Both of these are handled by performing a static code translation. That is,
Kate will read the page's code, and then modify that code before loading
it. The intent of this code modification is to get rid of any external
references that exist in the code (by pointing it to data in the cartridge
instead), and to load the Kate APIs code in the cartridge process.

The Kate APIs are injected at the very beginning of the page, so they're
always loaded before any other code. Along with the APIs there is some
code that is needed to establish the communication between the cartridge
process and the Kernel process, and to describe to the cartridge which
resolution it's running at.

The resolution of external references is a bit more involved. Kate will:

* Inline all scripts referenced in the page. That is, something like:

  .. code-block:: html

    <script src="scripts/main.js"></script>

  Becomes:

  .. code-block:: html

    <script>
      // contents of scripts/main.js
    </script>

* Inline all external CSS referenced in the page. Similar to the script
  translation, but transforming ``link`` tags into ``style`` ones, with
  the CSS contents in them.

  When translating CSS, Kate will also resolve all external references
  **in the CSS files**. That is, a CSS file that contains things like:

  .. code-block:: css

    @import url("theme.css");

    .main {
      background: url("bg.png");
    }

  Will end up like:

  .. code-block:: css

    // inlined contents of theme.css

    .main {
      background: url("data:image/png;base64,...")
    }

  Because Kate must be able to fully inline images and fonts in this case,
  the cartridge will fail to load at this stage if the file is too big to
  fit in a :term:`Data URL` (at the time of writing, this is 32 MB in
  Firefox).


* Inline all non-CSS external ``link`` tags using :term:`Data URLs <data url>`;

* Inline all small (less than 1 MB) images, audio, and videos using
  :term:`Data URLs <data url>`;

* Inject code to lazily load all large (more than 1 MB) images, audio,
  and videos using the :py:mod:`Cartridge File System API <KateAPI.cart_fs>`.

.. important::

  The code translator does not yet handle inline CSS. This has some unfun
  implications for Twine games and will be fixed in the next version.

  Kate also does not support ``srcset`` references, and there are no
  plans to support them currently. It's unclear if games benefit from
  and use ``srcset`` in the same way websites might.


Dynamic emulation
-----------------

Because games are not limited to static external resources found in the
initial HTML, but may rather load more data with JavaScript, or depend on
specific web APIs being available, Kate also offers a way of emulating
these behaviours when running the cartridge.

Emulation is done by injecting in the cartridge, during the initial static
code translation phase, additional code snippets that replaces the standard
web APIs with an implementation of similar behaviour using Kate's APIs instead.
These code snippets are called :doc:`Bridges </dev/manual/web/bridges/index>`, and cartridges must opt-in
for them, since they impact performance in general.

For example, if a cartridge opts in for the :doc:`Network Proxy </dev/manual/web/bridges/network-proxy>` bridge,
Kate will inject code that allows APIs such as `fetch <https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API>`, or dynamically
setting the ``src`` property of an image, to read data from the cartridge
file system instead of making a network request.

That is, when the following code is run:

.. code-block:: javascript
  :emphasize-lines: 1,3

  const config = await (await fetch("/config.json")).json();
  const bg = new Image();
  bg.src = config.background_image;
  document.querySelector("#game").append(bg);

It will have equivalent behaviour to the following code, but without any
code changes being needed:

.. code-block:: javascript
  :emphasize-lines: 1,2,3,5

  const text_decoder = new TextDecoder();
  const config_file = await KateAPI.cart_fs.read_file("/config.json");
  const config = JSON.parse(text_decoder.decode(config_file.bytes));
  const bg = new Image();
  bg.src = await KateAPI.cart_fs.get_file_url(config.background_image);
  document.querySelector("#game").append(bg);


