Sandboxing
==========

In order to protect your security and privacy Kate assumes that all
cartridges you run are potentially malicious, and preemptively limits
what they can do. This way, if that assumption ever turns out to be
true, the cartridge is very unlikely to be able to do any real damage
anyway.

This technique of limiting programs is called :term:`sandboxing`. The
cartridge runs with very restricted permissions so you always know
what you can expect from it, and it's easier to assess the risks of
running something.

Kate employs multiple levels of sandboxing to limit any possible
damage, and the next sections explain these levels.


Cartridge sandboxing
--------------------

At the most basic level, Kate uses cartridge sandboxing. This means that,
by default, cartridges in Kate can do exactly six things:

* Read files that were packaged with the cartridge (and only those files!);
* Play (local) sounds in one of the supported formats through your device's audio output;
* Play (local) videos in one of the supported formats;
* Display things on the screen made available to them by the emulator or Kate
  device;
* React to your input (through Kate buttons or pointer movement/click);
* And store very small amounts of data, of up to 64 MB, used for save files.

Cartridges cannot access the internet, they cannot access your camera, or
your microphone, or your location, or any other feature your device happens
to have. These restrictions are enforced for both security and privacy.
Without them there's not much damage a cartridge can do, even if it turns
out to be malicious.

By doing this Kate makes it possible for you to download any ``.kart`` file,
from anywhere, install it in the emulator, and play the game without having
to be as careful as with native executables. This sandbox is about
mitigating any possible damage (and all material damage), rather than
expecting you to predict all possible risks.

.. note::

   Kate can't do much about the *content* of the cartridge, however. There we
   rely on developers properly communicating what you can expect from a game,
   e.g.: by providing the appropriate rating and content warnings,
   and in trying to foster a community that cares about accessibility.


Component sandboxing
--------------------

Kate is a complex piece of software, but different components of Kate need
to be subject to different levels of scrutinity when it comes to security.
We can only guarantee that the cartridge sandboxing truly protects you if
Kate works correctly, after all.

Even though Kate is made out of several components there's only one that
needs heavy scrutinity to guarantee our security promises: the Kate Kernel.
This component is at the core of Kate, and it's what handles all cartridge
sandboxing and general data management in Kate. Bugs in the Kate Kernel are
extremely dangerous as they can break all of Kate's security promises.

However, bugs in other components of Kate should not be as dangerous. A bug
in the media gallery should *not* cause the cartridge sandboxing to stop
working—and if it does, Kate has failed as a secure software project.

To this end Kate places all these different components in a different
sandbox to make sure that, even if one of the components has a bug or is
faulty in some way, it cannot compromise the entire system, only itself.

.. note::

  Component sandboxing is not fully implemented yet.


.. _process sandboxing:

Process sandboxing
------------------

Components in Kate run in what's called a "process". This is a fancy word
for a component from your device's OS perspective. By placing components
with different levels of scrutinity into different processes Kate can
reuse the browsers process sandbox to contain any damage in these
components as well.

Chrome, Edge, Opera, and many other browsers based on Google's
Chromium browser all use the `Chromium sandbox <https://chromium.googlesource.com/chromium/src/+/HEAD/docs/design/sandbox.md>`_
to protect your device from these processes, and each process from each
other. `Firefox has its own sandbox <https://wiki.mozilla.org/Security/Sandbox>`_.
Safari, likewise, has a process sandbox.

Not all process sandboxes are equal—there are different kinds of attacks
these sandbox designs for different browsers can protect you against. But
they all share the goal of limiting the damage that any real attack can do
to your device.


Native sandboxing
-----------------

The native executable version of the Kate emulator is based on the
`Electron <https://www.electronjs.org/>`_ platform, like many other
popular applications. Electron on the other hand builds upon Google's
Chromium browser, and so inherits the same process sandboxing above.

Native Kate increases the possibilities of harmful attacks in the
Kate emulator because it has wider access to your device. And it
addresses this increase, again, with sandboxing. The native process
has unrestricted access to your device, but it only exposes harmless
features to the other Kate processes. That way, a bug in one of the
non-native Kate process (or a malicious cartridge running in Kate)
cannot gain further access to your device through the native process'
capabilities.

Bugs in the native process itself are still dangerous, however, because
the native process itself runs with very wide permissions.


OS sandboxing
-------------

Phone OSs make heavy use of sandboxing to contain damage from applications
with less-than-graceful intentions (or just unfortunate bugs). Modern
OSs do less well here as sandboxing is often not backwards compatible with
legacy applications.

Kate's native executable version is not currently sandboxed, but there are
plans to ship native executables that work with the OS native sandbox.
This means that, on Windows, the Kate native executable would be distributed
as a Windows Store application with limited capabilities. On Linux (and Steam OS)
we're looking into distributing Kate's native executable using
`Flatpak <https://flatpak.org/>`_ and `Snap <https://snapcraft.io/>`_, both of
which add OS-level sandboxing to Linux and thus limit any damage the
native process could cause.