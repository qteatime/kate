Tech specs
==========

The console
-----------

Kate is a console that uses 2020s technology to recreate some
of the feelings of early 2000s and 2010s technology and culture.
It sports a cute strawberry cake × cats themed case,
specific security feedback channels, and a proper cartridge slot.

The hardware comes in two versions. A handheld version, the Purr-fect Cookie:

.. image:: /user/diy/overview/img/cookie.png

And a small box with a CD/DVD reader that you plug into your TV,
the Cheesecake Vending Meow-chine:

.. image:: /user/diy/overview/img/cheesecake.png

.. note::

   The hardware, 3d models for the case design, operating system, and all
   other components are planned to be released as open-source in 2024, so
   you will be able to build your own physical Kate console from these parts.
   
   Right now only the :doc:`Kate Emulator <install>` is available
   as an early technology preview. The physical console will run the same
   software specification and thus be compatible with all Kate cartridges
   that run in the emulator, only with the hardware limitations specified
   below unless you build your console using custom hardware.


.. _hardware computing power:

Computing power
---------------

Kate is available in different versions, with increasing cost and computing
power capabilities. For requirements, games will include the lowest version
needed to play the game, as well as the recommended version.

============= ======================== ======================== ========================
\             Crystal (Casual)         Paper Lantern (Regular)  Phantom (Powerful)
============= ======================== ======================== ========================
**CPU**       1.8GHz (4 cores)         1.8GHz (4 cores)         2.4GHz (4 cores)
**RAM**       2 GB                     4 GB                     4 GB
**Storage**   32 GB                    64 GB                    128 GB
**SoC**       Raspberry Pi 4\*         Raspberry Pi 4\*         Raspberry Pi 5\*
============= ======================== ======================== ========================

.. note::

   The cases and operating system are designed to use off-the-shelf Raspberry Pi
   boards. You should be able to use other SoCs, but you'll need to modify at least
   the case and PCB designs, and you might need to patch Raspberry OS-specific
   components if you're using another Linux distribution.

.. _hardware graphics:

Graphics
--------

Kate has a native display resolution of 800x480 pixels. It can be upscaled to
1200x720 (1.5x) and 1600x960 (2x). The screen aspect ratio is 5:3. The handheld
version sports a 5" screen with touch support (5 points).

The GPU supports `OpenGL ES 3.1`_.

.. note::

   When running the emulator, this means that your GPU card should have
   at least been released after 2012, and have updated drivers that
   provide the needed functionality.

.. _OpenGL ES 3.1: https://en.wikipedia.org/wiki/OpenGL_ES#OpenGL_ES_3.0_2


Input
-----

Kate's gamepad has a total of 10 digital input buttons used for controlling
games, with two special digital buttons used by the OS:

* |btn_ok| *(Ok)*, |btn_sparkle| *(Sparkle)*, |btn_menu| *(Menu)*, and |btn_cancel| *(Cancel)* face buttons;
* |btn_dpad| *(D-Pad)*;
* |btn_l| and |btn_r| shoulder buttons;
* |btn_capture_text| and |btn_berry_text| (special, used by the OS);

Up to 4 gamepads can be connected to the console at a time, either through
bluetooth or directly through USB.

It also supports attached keyboards for text input, and styluses/touch for
pointer inputs. A haptics module for vibration and a 6-axis DoF sensor module
are planned.



Cartridges
----------

Games for Kate can be made with many different technologies, and are shared
as ROM files (physically distributed in mini CD/DVD), which Kate calls
a "cartridge". The ROM files incldue all the data needed to run the game.
There are no limits for the ROM file size.

Kate never runs the ROM files directly; rather they're copied into the
console in a more efficient format upon installation. From that point on,
as long as you don't archive the game in Kate, it can be played without
needing to keep the file around or inserting the disc [#f1]_.

.. [#f1] Kate cartridges contain no form of :term:`copy-protection`, and rather
   rely on players being respectful of game developers' wishes regarding
   sharing and modifying the game—such wishes are included in the cartridge's
   metadata and the console uses it to decide what affordances to provide the
   player with.