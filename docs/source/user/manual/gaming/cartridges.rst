ROM Cartridges
==============

Kate games are distributed as a special file called a "ROM cartridge", with a
``.kart`` extension. This file includes all data for the game, and some special
meta-data that Kate uses to present the game in the console and allow it to
be organised and searched for in your library.

Kate doesn't run cartridges directly from this ROM file. Instead, it installs
the contents of the file locally in the console in a more efficient format to
be able to start up games faster and using less memory. This means that,
once installed, you don't need to keep the file or disc around to be able to
play it.


.. _installing cartridges:

Installing cartridges
---------------------

Once you have a ``.kart`` cartridge file you can install it in Kate. In the
emulator, there are two ways you can install a cartridge:

**Drag-and-drop the cartridge file on the emulator**
   In a laptop or desktop computer, you can drag-and-drop one or more
   ``.kart`` files directly onto the console to install them.


**Use the "Install cartridge" button**
   From the Start screen in Kate, you can press |btn_berry_text| and
   select ``Install cartridge``. This will open a file picker where you can
   select the ``.kart`` files that you want to install.


Your library
------------

Cartridges that you install are available in your game library. The Start
screen lists your library games by recency. Here, recency is defined by
either when you last played a cartridge, or when you last installed it.

Sorting your library by when you last played requires that you enable the
:doc:`Play Habits <play-habits>` feature, which records this information locally. You can
enable or disable the play habits tracking from the ``Settings``.

You can play cartridges from your library by clicking them, tapping them,
or pressing |btn_ok| while they're focused.


Storage usage
-------------

After installation, all data necessary to run the cartridge is copied to
your device, so you can run it offline and without needing the original
cartridge file at any time.

If you need to delete data to make space up for new games, you may
consider :term:`archiving the cartridge <archiving>`. You can do
so from the cartridge's storage page (from the home screen, press |btn_menu_text|
and select ``Manage data``).

When archiving a cartridge, the cartridge data is removed from your local
device, but metadata (which Kate uses to display the cartridge), save data,
and media captures are kept around. This means that you can re-install the
cartridge at a later point in time and continue from where you left off.

Storage details are discussed in the :doc:`Storage section <storage>`.


Privacy & safety
----------------

Kate cartridges are fully :term:`sandboxed <sandboxing>`. This means that a cartridge
cannot access data on your device or use the internet in any way. By
sandboxing all cartridges Kate greatly limits the possible impacts to
your device or data, even if you end up running a malicious cartridge.

Cartridges that need more privileges can request special permissions
to do things with your device or data. This puts you in control of what
you're comfortable or not in letting the cartridge do, just like in mobile
phone OSs.

Details are discussed in the
:doc:`Security and Privacy <../security/index>` section.


Credits and licences
--------------------

Each Kate cartridge contains, embedded within it, the way the cartridge
is licensed to you—how the developers expect you to use the cartridge.
You can read the licence text by pressing |btn_menu_text| in the library and
choosing ``Legal notices``. Or pressing |btn_berry_text| while running a
cartridge and selecting ``Legal notices``.

Cartridges that have use the internet or link to an internet location in
any way also include a privacy policy, which you can find in the same menu
the legal notices are available.