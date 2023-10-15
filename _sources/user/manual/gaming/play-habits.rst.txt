Play habits
===========

Kate supports tracking which cartridges you play, and how much you play
them. This feature is called **Play Habits**, and can be enabled or
disabled from the ``Settings`` screen.

This data is used by Kate to sort your library, so cartridges you play
more frequently can be shown first.

.. important::

   Play habits are only ever stored locally on your device. No data about
   what cartridges you run ever leaves your device.


Last played time
----------------

Kate records the "Last Played Time" of a cartridge when you run the cartridge,
if this feature is enabled on your device. This enables Kate to sort your
library by recency—that is, the cartridges you've ran or installed more
recently will show up first.

The recorded date is stored accurately in Kate's database, but when reporting
it throughout the Kate's interface a less fine-grained approximation is used.
So, if it's 20 May 2023, and you've played a cartridge in 5 February 2023, Kate
will report it as "3 months ago" or "during 2023".


Total play time
---------------

Kate records the "Total Play Time" of a cartridge while you're running the
cartridge, or when you close a cartridge. By default this data is updated
every few minutes, so there might be cases where you run a cartridge and
no play time is recorded.

Like with "Last Played Time", this feature can be enabled or disabled in
the settings. Kate will record the amount of time in minutes in its
database, and will provide a rough approximation of this time when
reporting the data throughout Kate's interface. So, if you've played
a game for 5 minutes, you might see something like "played for a few minutes",
whereas if you've played a game a lot you might see something like
"played for 40 hours".


Deleting stored habits
----------------------

Habits are not automatically removed when you uninstall a cartridge. You
can manually delete habits about a specific cartridge by going to the
``Play Habits`` screen in settings.

Select the cartridge, then press |btn_menu_text| to bring up the options
and choose ``Delete play habits``. If you simply wish to remove **all**
recorded play habits, you'll find the ``Delete all play habits`` button
in this same screen.