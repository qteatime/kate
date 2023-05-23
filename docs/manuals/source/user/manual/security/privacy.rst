Privacy policy
==============

Kate does not collect any personally identifiable information from you,
and data about the cartridges you play never leaves your device. That said,
there are a few things that may be a cause for concern, depending on your
personal privacy context.


The web emulator
----------------

When using the web emulator, at <https://kate.qteati.me>, the server at
the end of that address will receive your computer's IP address. (since it
has to know where to send a reply back to—this happens for any website).
An IP address may provide to the server a rough estimate of your physical
location (e.g.: the country you're accessing the website from). The browser
also sends some information about your device to the server which will
may disclose your operating system, browser version, and other technical
details.

Kate developers do not have any tracking code and do not store or have access
to this information. However, the server is controlled by GitHub,
and we can make no guarantees about their internal processes with this data.
You can `read GitHub's privacy statements here <https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#data-collection>`_.

More troubling, however, is that all data stored locally in Kate's database
is available for any code loaded from <https://kate.qteati.me/>. This means
that if the server, domain, or your connection are compromised, you may
receive back malicious code that would have access to all data in your
Kate's database (but not other data in your device!).

Barring major crisis, Kate's domain and servers have a solid maintenance
plan until at least 2026. For archival uses, you should rather consider
running the whole emulator locally.


The updater
-----------

When accessing the update feature in ``About Kate``, your IP and some
information about your browser and OS will be sent to Kate's server.
See above for the privacy implications of this.


Running Kate offline
--------------------

If you install the Kate web application, but run it without any network
access, then no data leaves your computer as the files are all loaded from
your device's local cache. Do note that if you run it with a network
connection, then Kate will make a network connection to <https://kate.qteati.me>
to check for updates.


Locally collected data
----------------------

All data collected by Kate is stored locally on your device, and the Kate
emulator never sends it anywhere without your explicit consent. You can
control some of the data Kate collects from the ``Settings`` screen.

Information stored locally includes:

**The Kate settings**
   Things like connected gamepads, keyboard configuration, and accessibility
   options are stored under settings. You can remove this data by going to
   ``Settings -> Diagnostics & Recovery`` and using the
   ``Restore default settings`` button.

**Cartridges and save data**
   This includes cartridges you install, and any data they store in your device.
   You can remove this data by going to ``Settings -> Storage`` and using one
   of the :ref:`cartridge data management options`.

**Play habits**
   This includes things like when you last ran a cartridge and how much you've
   played them. You can choose to not have this data collected under
   ``Settings -> Play habits``. You can also delete any previously collected
   data (all of it, or for specific cartridges) from the same screen.

**Update channel and version**
   Kate tracks which version you're running and which updates it can offer
   you. You can change the update channel from the ``About Kate`` screen,
   however fully removing this data is only possible if you erase all data
   in the Kate database, resetting the console.

You can erase all data Kate has stored locally and reset the console by going
to ``Settings -> Diagnostics & Recovery`` and using the ``Delete all data``
button.

When running the web version of Kate, you can also remove all data using your
browser's "Clear cookies and site data" feature. You should make sure to clear
*all* data used by Kate if using this, as otherwise the browser will leave
Kate in an inconsistent state and the emulator will never be able to start
again afterwards.