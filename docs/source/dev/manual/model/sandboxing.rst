Sandboxing and APIs
===================

All cartridges run in a :term:`sandboxed iframe`. This iframe runs with
no exposed web APIs (other than the ability of playing sounds and videos),
and with a very restrictive :term:`content security policy`. It also
runs with no :term:`origin`—this means no access to any web APIs that
touch storage or require a defined origin.

The biggest implication of the sandboxing is no direct access to any
web API, and not being allowed to load any asset by using a URL. For
example, this means that the following way of loading an image will
never work in Kate:

.. code-block:: javascript

   const img = new Image();
   img.src = "/sprite.png";

Instead, data needs to be read from the cartridge's file system using
the Kate cartridge file API:

.. code-block:: javascript

   const img = new Image();
   const file = await KateAPI.cart_fs.read_file("/sprite.png");
   const blob = new Blob([file.bytes], { type: file.mime });
   img.src = URL.createObjectURL(blob);

The same is true for any other web api besides Canvas and Web Audio: rather
than being used directly, you need to use the equivalent Kate Runtime API
instead.


Reading files
-------------

A cartridge can read files that were bundled with it. The cartridge file
system is a read-only API that gives you access to the binary data of
the file as well as its :term:`MIME type`.

Reading files is always asynchronous because only the Kate Kernel process
has access to them; the cartridge must send a message to the Kernel process
requesting the file data. There's currently no way of streaming file
contents, so reading a large binary file means that all of its contents
need to be read into memory and then copied to the cartridge process,
so it's a good thing to read files upfront and keep them around, rather
than re-reading them multiple times.

Such functionality is provided by the minimal :py:mod:`KateAPI.cart_fs` API.


Input
-----

Because Kate blocks direct interaction with the cartridge's screen
(by placing a protective screen above it), the cartridge never receives
the user's focus. And likewise never receives direct input, be it from
keyboard, gamepad, or pointer devices. No :term:`DOM trusted events` ever
flow into the cartridge either.

Instead, cartridges must use the :py:mod:`Input API <KateAPI.input>` and
:py:mod:`Pointer Input API <KateAPI.pointer_input>` to react to player
interaction.


Save data
---------

The cartridge loads in a "null origin", which means that it will not
have access to any storage API from the browser. This is because browsers
require a secure connection and a defined origin to be able to
properly partition things like Local Storage and IndexedDB.

Instead, cartridges can make use of the :py:mod:`Object Store API <KateAPI.store>`
to save and read small amounts of data as necessary to track players' progress
in the game.


Screenshots and video capture
-----------------------------

Some engines provide native support for taking screenshots or video
captures of the game play. For example, `Ren'Py <https://www.renpy.org/>`_ allows one to take
a screenshot in its web export and have it automatically downloaded
in the device. This is also true for other engines like `Pico-8 <https://www.lexaloffle.com/pico-8.php>`_.

Because Kate blocks any download or navigation initiated by the
cartridge to protect players' safety, these features will not work in
Kate. Instead, cartridges will need to rely on Kate's native screenshotting
and video capture support, which can be done by registering what parts of
the game should be captured using the :py:mod:`Capture API <KateAPI.capture>`.