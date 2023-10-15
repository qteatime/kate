Hello, World
============

Creating a start page
---------------------

Let's start by trying to get something to show up on the screen, to make
sure everything is set up correctly and your Kate emulator can play games.

To begin with we'll create a HTML page. Kate cartridges distributed with
the web runtime all start with one HTML page.

Create a file called ``index.html`` in your text editor with the following
contents:

.. code-block:: html

   <!DOCTYPE html>
   <html>
     <head>
       <style>
         body {
           margin: 0;
           padding: 0;
           width: 100vw;
           height: 100vh;
           display: flex;
           align-items: center;
           justify-content: center;
           background: white;
           color: black;
         }
       </style>
     </head>
     <body>
       <h1>Hello, from Kate!</h1>
     </body>
   </html>

Here we have a page with the text "Hello, from Kate!", and some :term:`CSS`
to put it in the centre of the screen. If you open ``index.html`` on a
web-browser you should see something similar to the image below:

.. image:: img/demo1.png


Cartridge metadata
------------------

Not very exciting, but hey, baby steps!

Now, we want to turn this into a Kate cartridge, which we can then install
in a Kate emulator to play. To do so we'll need to create a file describing
the cartridge, that's then used by the ``kart`` tool to build the actual
cartridge.

Create a file called ``kate.json`` in the same folder as your ``index.html``,
and give it the following contents:

.. code-block:: json

   {
     "id": "my-namespace/my-first-cartridge",
     "version": {"major": 1, "minor": 0},
     "metadata": {
       "presentation": {
         "author": "Your Name",
         "title": "My First Cartridge",
         "tagline": "My first cartridge"
       }
     },
     "files": ["index.html"],
     "platform": {
       "type": "web-archive",
       "html": "index.html"
     }
   }

This file tells the ``kart`` tool that there's a game identified by
``my-namespace/my-first-cartridge``. This identification **must** be
unique, and we'll get into what that means later. A version must also
be provided, here the version is "1.0".

We also provide a more readable title, ``My First Cartridge``. This is
what players will see in the cartridge selection screen.

Next we tell Kate what files are actually in the cartridge. Our cartridge
so far is made up of a single file, ``index.html``. All files we declare
in this ``files`` section will have their contents included a special
:term:`file system` in the cartridge file.

Finally, in order to play this cartridge, we tell Kate to use the
``web-archive`` platform. This means that 
Kate will treat it as if it was a web page of sorts. This ``web-archive``
platform requires us to specify which web page Kate should load first;
we only have one, so ``index.html`` is is.


Packaging your game
-------------------

With all the incantations in place, what's left is asking the ``kart`` tool
to turn this configuration into an actual cartridge file. You do so by
running the following command from the same directory your ``kate.json``
and ``index.html`` files are:

.. code-block:: shell

   $ kart kate.json --output my-first-cartridge.kart

This should create a ``my-first-cartridge.kart`` file in the same folder
you have ``kate.json`` and ``index.html``. The screen should include a
summary of all the things that were packaged in the cartridge file.

To :ref:`install this cartridge <installing cartridges>`, you can drag-and-drop
it on your Kate emulator. Or use the ``Install cartridge...`` option in the
context menu.

After installing, your emulator should look like this:

.. image:: img/demo2.png

And if you click on the cartridge (or press |btn_ok|) to play it, your
emulator should look like this:

.. image:: img/demo3.png


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

