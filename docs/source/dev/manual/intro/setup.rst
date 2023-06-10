What will you need?
===================

Installing the emulator
-----------------------

To run games in Kate you'll need an emulator. The recommended way of testing
the games is to use the web-based emulator, which you can open in a modern
browser by accessing https://kate.qteati.me

The :doc:`intallation instructions section </user/manual/intro/install>` goes
into more details about what browsers are supported, specific instructions
for platforms like Steam Deck, and alternative installation options.


Installing the developer tools
------------------------------

The tools used for developing Kate games require `Node.js <https://nodejs.org/en>` [#f1]_
to be installed, so you'll need a device capable of installing it. Node.js
supports Windows, MacOS, and Linux.

You'll also need to be familiar with the :term:`command line`, and with the
`basics of web development <https://developer.mozilla.org/en-US/docs/Learn>`.

Once you have Node.js installed, you can install all tools necessary for
building Kate games from the command line:

.. code-block:: shell
   
   $ npm install -g @qteatime/kate-tools


.. important::
   
   The ``$`` just indicates that you should run these commands as your
   regular user, not with the administrator account. You should not type
   the ``$`` when running these commands.

   No part of Kate (and its tools) require administrator privileges, and
   they never will.

After running this command you should have two new applications available
in the command line:

* **kart** is used for packaging your games into a single ``.kart`` file,
  which you can distribute for your players to install.

* **kate-dist** is used for bundling a ``.kart`` file and the Kate emulator
  into a web page, which you can then upload to a platform like Itch.io
  as a web game. You'll need to zip the contents of the generated folder
  yourself.

.. [#f1] There's a planned tool, called Kate Studio, which will allow you
   to build games right from inside Kate, and thus avoid the need to install
   any of these command line tools. But that will only happen after the
   stable release.