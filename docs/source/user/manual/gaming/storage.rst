Stored data
===========

All data in Kate is stored locally in your device, and never leaves your
device. This is true for Kate's cartridges, settings, save data, and
screenshots/video recordings of cartridges. Even if you're running
the web version of the emulator.

There are two consequences to this. One is that you can run any cartridge
without needing an internet connection, just take your device with you.
The other is that you can't easily start playing a game in one device
and continue it in a different device.

You also need to ensure that your device has enough storage space to
keep all of this data. You can check your storage usage from the
``Settings -> Storage`` screen, and you can choose to archive
cartridges to free up space from there as well.


.. note::

   Syncing save data between devices is planned for a future version, but
   not currently implemented. There are no easy ways of syncing multiple
   devices currently.


System storage
--------------

Kate needs to store data that is used by the emulator itself to function.
This includes:

* The emulator code and assets;
* All of the settings that you can change in the ``Settings`` screen;
* Performance-related caches;
* Meta-data required to manage all other data Kate stores.

Kate itself does not offer a detailed breakdown for this data, and rather
groups all of it under ``System`` in the storage summary. There's no way
of removing or manually changing part of this data without corrupting the Kate
emulator and having to reset to factory defaults (hence losing all your data).

.. warning::

   Your browser might provide tools for inspecting and managing stored data
   in a more fine-grained way, but such usage is not supported by Kate, as
   the browser does not have enough information to guarantee changes will
   keep the data in a usable state; modifying them without knowing what
   you're doing risks corrupting the emulator and cause permanent data loss.

   Remember: Kate only stores data locally in your device. If it's gone,
   it's gone **forever**. There are no ways to recover it.


Media storage
-------------

This is where Kate stores all screenshots and video recordings that you
make using the capture button (|btn_capture|). They're grouped under
``Media`` in the storage summary.

Each individual piece of media is associated with a cartridge, so when
viewing data about a cartridge you will also get a summary of the portion
of the media storage that it uses.

Kate allows you to delete individual media files by opening them in the
media gallery and selecting ``Delete`` from the options menu.

.. note::
  
   Deleting multiple media files with a single operation is planned for
   a future version, but not currently implemented.


Cartridge storage
-----------------

When you install a cartridge from a ``.kart`` file, Kate will copy all
necessary data to the Kate cartridge storage and keep it in an efficient
format for running the game later. This format allows Kate to run the
cartridge with a shorter startup time and using less memory. These will
show up under ``Cartridges`` in the storage summary.

Cartridge data can be removed by :term:`archiving` them. This will remove
the cartridge files, but keep all media, save data, and meta-data around.
That means that you can re-install the cartridge at any point and continue
from where you left off.

You can also delete the cartridge along with all its associated data. In
this case, reinstalling the cartridge will not restore that data; when you
later run the reinstalled cartridge, it'll be as if you were running it
for the first time.

Both archiving and deleting the cartridge data can be done from the
cartridge storage screen, which you access by selecting a cartridge
in the storage settings.


Save data storage
-----------------

Cartridges can store small amounts of data when you play them; Kate refers
to this as "Save Data", and this usage is grouped under ``Saves`` in the
storage summary. You can manage cartridges' save data from the cartridge
storage screen.

See the :doc:`save data section <save-data>` for details.


Free space
----------

If you're running the native emulator, or the web emulator in a browser that
provides this information, you'll see the remaining space Kate can use under
``Free`` in the storage summary.

When you're running out of space, you may get a notification alert about it,
along with a :ref:`low-space indicator <resource indicator icons>`
in the resource indicator bar.

.. important::

   This space is not necessarily the amount of space you have remaining
   in your device, if you're running Kate from a web browser. That's because
   web browsers define a smaller storage quota to ensure web pages won't
   negatively affect your device's performance.
   
   Kate itself also adds a safety margin to this quota, so you might get
   alerts about your storage space running low even when you have more
   space available in your device.
