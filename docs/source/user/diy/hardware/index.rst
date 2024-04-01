The hardware
============

The Kate system is a software project which needs some form of computer to
run it---some hardware. Some of the choices made by the Kate project means
that you have a wide range of possible hardware to choose from when building
your console, as long as they fulfil the minimum performance and capability
requirements. For example, you can run a Kate system on top of a recent
Android phone, but you won't be able to run it on a Raspberry Pi Zero
because the Zero version doesn't have enough processing power and memory.

So, what do you need to be able to run a Kate system? That depends on what
exactly you want out of it. Remember if you're buying the pieces yourself,
more capabilities also mean a more expensive and more complex project to
build. You can always start with the minimum and try new things later!


Minimum requirements
--------------------

Kate is built on top of the `Chromium <https://www.chromium.org/chromium-projects/>`_
project and needs at least a device capable of running Chromium with
hardware accelerated graphics (the device must support OpenGL ES 3.1 or newer).
All performance tests are done on a
`Raspberry Pi 4B <https://www.raspberrypi.com/products/raspberry-pi-4-model-b/specifications/>`_
device with 2GB+ RAM, so you can't go wrong with something at least as
powerful as that.

This means you'll need:

- A reasonably powerful CPU *(we recommend not going lower than 1.8GHz)*;
- A moderately modern GPU *(has to support OpenGL ES 3.1 or newer)*;
- A supported CPU architecture and operating system:

  - Windows 10+ *(x86, x64 // Intel/AMD 32 or 64 bit)*;
  - Linux *(x64, ARM64, ARMv7l // Intel/AMD 64 bit, ARM 32 or 64 bit)*;
  - MacOS *(x64, ARM64 // Intel or Apple chips)*;
  - Android *(anything running modern Chromium)*;
  - ChromiumOS/ChromeOS *(anything supported by ChromiumOS)*;
  - iOS *(ideally running modern Chromium, but modern Safari is mostly supported)*;

- At least 2GB of RAM *(chromium has high memory requirements for isolated processes)*;


Connecting gamepads
'''''''''''''''''''

Kate relies on Chromium's gamepad support, and Chromium supports both wired
and wireless connections. Wireless connections may have higher input lag.

Depending on what you're connecting you'll want at least:

- A USB type A port *(for wired USB gamepads)*;
- A Bluetooth chip *(for wireless gamepads)*;

If you're connecting retro gamepads directly (e.g.: a real SNES, Playstation,
N64, etc. controller), note that Kate does not offer any direct support for
them, and you'll need to figure out how to expose them to Chromium yourself.


Network usage
'''''''''''''

Kate uses the network to download OS updates, games, catalog changes, and
public keys used to verify cartridges. It also uses the network to synchronise
save and configuration data between Kate devices. For playing games, as long
as the cartridge itself has no online play requirements, Kate can run entirely
offline.

If you're doing updates or sync'ing over the network you'll likely need either
a wired Ethernet connection or a wireless Wi-Fi connection supporting hardware.


Audio and display
'''''''''''''''''

Ideally, the hardware you pick should have stereo audio, as that's what games
will expect. If you're picking your own display as well, note that Kate expects
a 5:3 aspect ratio and a minimum resolution of 800x480 pixels. This is the
common configuration for many screens offered for the Raspberry Pi.
  