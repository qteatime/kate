Screen recording
================

The capture button (|btn_capture|) can be used to take screenshots and record
game play videos. What you can record is decided by the cartridge itself, so
a cartridge might enable captures for only portions of the game, or not support
the feature altogether.


Screenshots
-----------

Press |btn_capture_text| once to take a screenshot of the running cartridge.
The screenshot will be in the dimensions the game uses, but not necessarily
the dimensions of the Kate screen. For example, Bitsy games are usually
512x512 pixels, and screenshots of Bitsy games will maintain that resolution,
even if your screen is configured for 1200x720.

Screenshots are stored in Kate as a loss-less PNG; compression is managed
by the browser engine you're using, so some browsers may not apply any
compression to it. There's a limit of 2 MB to each individual screenshot.


Video recording
---------------

Hold |btn_capture_text| for one second to start recording the cartridge's
screen. Hold it again for another second to stop recording and save the
video. Kate can record up to one minute of gameplay in this manner (and
up to 64 MB for a single video), and recording is done in the cartridge's
original resolution, regardless of what resolution you're using for Kate.

Video captures are done in `WebM`_ using Google's `VP9`_ codec and the
default browser's configuration for the video quality. Encoding is
likely done by the browser software, so, in slower devices or more
demanding games, it can impact your game play as it requires more
resources from your device's processor.

.. note::
   
   Currently Kate does not support recording the audio from the game. This
   feature is planned for a future version, but currently you will only
   be able to record the screen.

.. _WebM: https://en.wikipedia.org/wiki/WebM
.. _VP9: https://en.wikipedia.org/wiki/VP9


Viewing and managing
--------------------

Screenshots and video recordings taken from games are stored locally in
Kate and can be viewed from the **Media Gallery** application. You can
access this application by pressing |btn_berry_text| and selecting
**Media Gallery** (if you do so while running a cartridge, the gallery
will be filtered to media you've captured from that cartridge).

In the media gallery you can view screenshots and replay video captures.
You can also download these media files to your device by opening them
in the gallery, then pressing |btn_menu_text| and selecting ``Download``.
This is also how you can delete individual media files in Kate.