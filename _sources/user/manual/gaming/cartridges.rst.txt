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

   .. raw:: html

      <video src="../../../_static/video/kate-dnd.webm" controls>


**Use the "Install cartridge" button**
   From the Start screen in Kate, you can hold down |btn_menu_text| and
   select ``Install cartridge``. This will open a file picker so you can
   select the ``.kart`` files that you want to install.

   .. raw:: html

      <video src="../../../_static/video/kate-install-cartridge.webm" controls>


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

In the future, cartridges will be able to request special permissions
to do things with your device or data, which puts you in control of what
you're comfortable or not in letting the cartridge do.

Details are discussed in the
:doc:`Security and Privacy <../security/index>` section.


Credits and licences
--------------------

Each Kate cartridge contains, embedded within it, the way the cartridge
is licensed to you—how the developers expect you to use the cartridge.
You can read the licence text by pressing |btn_menu_text| in the library and
choosing ``Legal notices``. Or holding down |btn_menu_text| while running a
cartridge and selecting ``Legal notices``.

There are three portions to this screen:

**The specific licence the cartridge uses**
   Games may be released under open-source permissive licences, such
   as `Creative Commons <https://creativecommons.org/>`_, or they may
   be released under proprietary, restricted licences. Unless otherwise
   stated, the cartridge contents belongs to its original developers,
   and it is they who decide in what ways you can engage with the
   cartridge.

**The cartridge allowances**
   Kate has a philosophy of giving players control over how they run
   their games. This is very important from an accessibility perspective,
   as players with particular accessibility needs **may have to** modify
   the cartridge in ways the original developer did not intend to be able
   to play it at all.

   The allowances section of the cartridge's licence summarises these
   allowances, so you can make your changes while staying compliant and
   respectful of the developer's wishes.

**The licence text**
   This is the full licence text that developers may include in their
   cartridge. The text is legally binding, whereas the other sections
   of the cartridge's legal notices are just informative summaries.

   This text often contains the full game credits, as well as legal
   notices of any third-party software/assets that the cartridge
   includes.