Privacy policy
==============

Kate does not collect any personally identifiable information from you,
and data about the cartridges you play never leaves your device. That said,
there are a few things that may be a cause for concern, depending on your
personal privacy context.


The web-based emulator
----------------------

When using the web emulator through the public instance,
at https://kate.qteati.me, the server at the end of that address will
receive your computer's IP address (since it
has to know where to send a reply back to—this happens for any website).
An IP address may provide to the server a rough estimate of your physical
location (e.g.: the country you're accessing the website from). The browser
also sends some information about your device to the server which
may disclose your operating system, browser version, and other technical
details.

The public instance does not have any tracking code, however access information
is logged for debugging and security purposes. This data is kept for the
duration necessary to debug issues and protect the server itself from
malicious traffic.

More troubling, however, is that all data stored locally in Kate's database
is available for any code loaded from https://kate.qteati.me/. This means
that if the server, domain, or your connection are compromised, you may
receive back malicious code that would have access to all data in your
Kate's database (but not other data in your device!).

Barring major crisis, Kate's public instance has a solid maintenance
plan until 2028. For archival purposes you should rather consider
:ref:`running your own Kate instance` or using the :ref:`native application`.


Running Kate offline
--------------------

If you install the Kate web application from the public instance, but run it
without any network access, then no data leaves your computer as the files
are all loaded from your device's local cache. Do note that if you run it
with a network connection, then your browser may make a network connection
to https://kate.qteati.me to check for updates.


Locally collected data
----------------------

All data collected by Kate is stored locally on your device, and the Kate
emulator never sends it anywhere without your explicit consent. You can
control some of the data Kate collects from the ``Settings`` screen.

Information stored locally includes:

**The Kate settings**
   Things like connected gamepads, keyboard configuration, and accessibility
   options are stored under settings. You can remove all this data by going to
   ``Settings -> Diagnostics & Recovery`` and using the
   ``Restore default settings`` button.

**Cartridges and save data**
   This includes cartridges you install and any data they store in your device.
   You can remove this data by going to ``Settings -> Storage`` and using one
   of the :doc:`cartridge data management options </user/manual/gaming/storage>`.

**Play habits**
   This includes things like when you last ran a cartridge and for how long you've
   played them. You can choose to not have this data collected under
   ``Settings -> Play habits``. You can also delete any previously collected
   data (all of it, or for specific cartridges) from the same screen.

**Audit log**
   This includes things like what cartridges were installed, what permissions
   were granted, and similar changes to Kate's database. Logs are subject to
   the retention you specify in ``Settings -> Audit log``.

**Developer profiles**
  If you've created a developer profile in the console to publish your own
  Kate cartridges, then the developer data is stored only locally in your
  device. You can manage it in ``Settings -> For developers``.

**Public and private keys**
  Kate stores public keys of developers whose cartridges you've trusted before,
  and it can store your own public and private keys if you've created a
  developer profile. Private keys are always stored encrypted with your
  store's password and never leave your device. You can manage your keys
  in ``Settings -> Secure key store``.

You can erase all data Kate has stored locally and reset the console by going
to ``Settings -> Diagnostics & Recovery`` and using the ``Delete all data``
button.

When running the web version of Kate you can also remove all data using your
browser's "Clear cookies and site data" feature. You should make sure to clear
*all* data used by Kate if using this, as otherwise the browser will leave
Kate in an inconsistent state and the emulator will not be able to start
again afterwards.