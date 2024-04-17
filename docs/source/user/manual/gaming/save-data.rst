Save data
=========

Games (and other applications) can store small amounts of data while
they're running; Kate refers to this as "Save Data", since it's often
used to record your progress in the game.

Save data in Kate is not stored in files, but rather internally in the
console's database. It's then divided into :term:`Partitions <storage partition>`.
All cartridges have an "unversioned" partition, which can be read by
any version of the cartridge, and also one partition for each version
of the cartridge that you install.

These versioned partitions allows you to safely upgrade cartridges,
without having to worry about your save data being corrupted. If you
upgrade, and it turns out that the new version doesn't work as you
expect, you can also re-install the previous version and continue
from where you left it off—no data for that version will have changed.


Managing stored data
--------------------

Save data is associated with a specific cartridge, so you can manage it
from the cartridge's storage screen. You can get to this screen by
pressing |btn_berry_text| to bring up the context menu, selecting
``Settings -> Storage``, and then the cartridge you want. Or by using the
``Manage Data`` option for a cartridge in the library. When you're running
a cartridge, the ``Storage`` button in the context menu will also work.

The cartridge storage page includes a summary of all data related to
the cartridge that Kate is storing; you can check the save data in
particular by using the ``Manage save data`` button.

From the save data management screen you can delete all save data used
by the cartridge. This is an irreversible operation: once you delete it,
it's gone, and there's no way of recovering the data. Your cartridge will
run as if it was the first time you opened it at all.

.. note::

   Cartridges can store data in any format, so there's no way for Kate to
   provide acces to delete parts of the data. If Kate allowed that, it
   would not be able to guarantee that the resulting save data would
   still be usable.