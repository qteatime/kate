Capabilities
============

Kate uses a model called "Capability Security" to ensure that users are
always in control of how much risk they're taking when running cartridges.
This is particularly important for tools and applications, as the default
things a cartridge can do are often enough for most games.

"Capability Security" is really just a fancy name to a model where permissions
are assigned to each individual application you have on your device, rather
than those applications inheriting all permissions of the user running them.
You might already be familiar with this model if you've used applications for
smartphones before — both iPhones and Android phones use capabilities for
their application security.


Types of capabilities
---------------------

Capabilities in Kate are divided in two categories:

* **Contextual** capabilities are the ones your cartridge asks for when the
  user is performing an action. For example, if the user can click on a button
  in your application and get asked "X would like to access one of your files"
  with the possibility of selecting a file to grant your cartridge access to,
  that's a contextual capability — the actual grant of the access happens
  in a specific context, so the user is aware of the cause/effect, and must
  agree to the permission request every time they click that button.

* **Passive** capabilities are the ones your cartridge asks for when the user
  is installing your cartridge. For example, a multiplayer game needs to send
  and receive data to other computers all the time, it would not be feasible
  to show a confirmation dialog every time data is sent over the internet.
  So, instead, the cartridge gets to ask for it once during installation and
  have access to it with no dialogs afterwards.

  To be transparent, Kate will always show an icon related to the resource
  your cartridge is using while you have access to a passive capability. The
  icon is shown from the moment your cartridge requests the API object for
  that capability until the moment your cartridge asks for that object access
  to be revoked.

Further, capabilities can be **required**, if the cartridge cannot function
without them, or **optional**, if the cartridge could offer additional features
by getting such access, but if it doesn't it can still offer the player a
simpler set of features.


Granting and revoking
---------------------

Capabilities are always first granted at the point where your cartridge is
installed. From that point on, players can revoke or grant a capability by
going to the ``Settings -> Permissions`` screen.

Contextual capabilities are also "granted" at the point where the cartridge
is installed. This might sound odd, but you should think of it as the
cartridge being granted the power of asking for the capability at any
point in time.

For example, if your cartridge requires "Device File Access" (a contextual
capability), then it will only get access to actual files after the user
is shown a confirmation dialog and chooses a file to grant your cartridge
access to. Every time you ask for a file the user will see this same
confirmation dialog and will have to select the file again.
But if the user revokes your capability of "Device File Access"
at any point in time, your request for a file will be immediately rejected,
with no confirmation or dialog being shown to the user.


Contextual capabilities
-----------------------

Having these capabilities allows the cartridge to ask for other accesses
in the context of a user action.


.. _open urls capability:

Open URLs
'''''''''

:Risk: Medium
:Main concerns: Data exfiltration, privacy
:Gates access to: :meth:`KateAPI.browser.open`
:Kart type: ``open-urls``

Kate blocks any sort of internet access and URL navigation in a cartridge
for security and privacy reasons. However, some times it's useful for a
cartridge to ask for a URL to be opened in the user's browser.

.. important::
  
  If your cartridge requests this capability, it **MUST** also provide a
  privacy policy that covers what data the target URLs collect from the
  user when they land.


.. _download files capability:

Download files
''''''''''''''

:Risk: Critical
:Main concerns: Escalation, unsandboxed code execution
:Gates access to: :meth:`KateAPI.browser.download`
:Kart type: ``download-files``

Allows a cartridge to ask the user to get a file saved to their device's
regular file system. The file is treated in the same way any other
browser download would be.


Show dialogs
''''''''''''

:Risk: low
:Main concerns: Denial of service, bad user experience
:Gates access to: :mod:`KateAPI.dialogs`
:Kart type: ``show-dialogs``

Allows a cartridge to show Kate OS-like modal dialogs to the user, such
as message alerts or requests for text input.


Request device files
''''''''''''''''''''

:Risk: High
:Main concerns: Privacy, general security, privilege escalation
:Gates access to: :mod:`KateAPI.device_file`
:Kart type: ``request-device-files``

Allows a cartridge to ask the user for read-only access to a single file
or a single directory.


Install cartridges
''''''''''''''''''

:Risk: Critical
:Main concerns: Escalation, code execution, general security
:Gates access to: :mod:`KateAPI.cart_manager`
:Kart type: ``install-cartridges``

Allows a cartridge to ask the user to install a cartridge by providing
the cartridge's binary data.