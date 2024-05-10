Cartridges
==========

Kate applications are packaged in cartridges, which contain all data necessary
to run it, along with meta-data used for presenting it and deciding how to
run it. Cartridges are a distribution format, but not an executable one—Kate
always unpacks this cartridge data in the device's local storage to give it
a more efficient format for execution.

Cartridges are made out of four main sections:

* The **Identification**, which provides Kate with information to uniquely
  identify the cartridge and who published it;

* The **Meta-data**, which provides Kate with information to present the
  cartridge and allow it to be searched for;

* The **Security**, which specifies which additional capabilities the
  cartridge needs to function;

* The **File system**, which provides Kate with all data that makes up the
  cartridge; and

* The **Runtime**, which provides Kate with information about how to run the
  cartridge.

.. _cartridge identification:

Identification
--------------

Each cartridge has a unique identifier, which is written in the form:
``namespace/name``. Here ``namespace`` is a domain name that you own,
whereas ``name`` is a name that must be unique in that namespace.

For example, given a cartridge identified by ``qteati.me/the-sound-of-rain``,
this means that the author has a game named ``the-sound-of-rain``, and this
is published by someone who owns the domain ``qteati.me``. Having domains be
something authors own makes it easier for Kate to do automatic verifications
about the origin of a cartridge, improving users' trust.

You can use something like ``your-username.itch.io`` if you don't own a
top-level domain. This is a less strong guarantee for origin verification,
but for Kate's use cases it's often good enough.

The cartridge identifier is complemented by the ``version``, in the form
``<major>.<minor>`` (e.g.: "1.4"). Only one version of a cartridge can
be installed at any given time.

.. important::

   Namespaces and names can only contain lower-case latin letters, hyphens, and
   dots. Each side must have at least one letter, and the whole identifier
   cannot exceed 255 characters. These restrictions are used
   to prevent :term:`spoofing attacks <spoofing attack>`, where an attacker chooses a
   different-but-sufficiently-similar name to confuse users into granting them
   access or information that players think they're giving someone else.

   E.g.: if we allowed upper-case and lower-case letters, then an attacker could
   choose the name ``Ialu.games.io/game`` to trick users into thinking it's
   actually the trustworthy ``lalu.games.io/game``, since many fonts have
   upper-case ``I`` and lower-case ``L`` rendered in hard-to-distinguish ways.
   Not limiting it to latin letters would increase risks even further, and create
   issues for players relying on screen-readers.


Meta-data
---------

The cartridge meta-data includes information that Kate uses to display the
cartridge in the library and allow players to filter or create dynamic
collections. It will also be used by other tools (such as the catalog feed
ones) to extract information necessary to present a cartridge.

The meta-data is itself divided into further sections:

* **Presentation**: This provides information about how Kate should present
  your cartridge to users across the console and in the catalog. It includes
  the game's title, author, thumbnails, etc.

* **Classification**: This provides information about the content of the
  cartridge, such as genre, age appropriateness, and content warnings.

* **Legal**: This provides information about what the user is allowed to
  do with the cartridge, and what rights they hold. It includes information
  on the cartridge's licence and privacy policy;

* **Accessibility**: This provides information about how the game can be
  played. It contains things such as what input methods are supported,
  which languages are offered, whether the cartridge has additional
  accessibility provisions, etc;


Security
--------

Cartridges run in a sandboxed environment with no powers by default. You can't
read files outside of your cartridge, save files to the player's device,
make network calls, or even take keyboard input.

In order to be able to do any of these things, your cartridge needs to ask
for them — and the player needs to consent in giving your cartridge those
powers over their device. The security section of the cartridge is where you
specify which of these powers your cartridge needs to be able to work.

You might already be familiar with capabilities if you've used phone
applications before; Kate's capabilities are slightly different, but
very much related. The :doc:`Capabilities <capabilities>` section explains
this in more details.


.. _cartridge versioning:

Versioning
----------

Like said previously, each cartridge has a release version, using a
``<major>.<minor>`` format (e.g.: ``5.2``). Kate only allows one version
of each cartridge to be installed at any given time.

When a player tries to install a cartridge that has the same version
as the one already installed, Kate will just skip the installation altogether,
so you're expected to change the version every time the contents of the
cartridge change.

When a player tries to install a cartridge that has a different version
already installed, they will be prompted about upgrading or downgrading
the cartridge. When using versioned save data, downgrades are always
safe.


.. _cartridge usage terms:

Usage terms
-----------

A cartridge metadata includes the terms of using the cartridge. This comes in
the form of a legal notices text, which is then made available to players in
the console through the context menu.

Any cartridge that uses the internet or includes links to internet addresses
in any form **must** also include a privacy policy, which indicates to the
user if any data is collected and how this data is used.

Cartridges are also encouraged to specify their policy on derivative works
(e.g.: game mods). The default value allows users to modify the cartridge
strictly for personal use, however this can be changed to disallow any
modification or to allow non-commercial or commercial sharing of derivative
works.

The reason personal modifications are allowed by default is that players
with particular accessibility needs may need to make modifications to be
able to play at all. While you can change the default, supporting personal
accessibility needs is encouraged.


.. _cartridge rating:

Rating
------

All cartridges are expected to provide an age appropriateness rating and
necessary content warnings. Failing to do so might cause the cartridge to
be hidden from the official channels, or require the player to agree to
possibly explicit content before they can install and play.

Rating is made out of an age-appropriateness rating from the author's
perspective and not governed by any regulatory body. It can be one of:

* **General** — the author sees it as appropriate for any audience;
* **Teen-and-up** — the author thinks the game is not appropriate for
  younger kids (generally aged 12 and younger);
* **Mature** — the author thinks the game is only appropriate for adult
  audiences. It may include depictions of violence, sex, abuse, and other
  heavy topics, but there's nothing very explicit;
* **Explicit** — like mature, except things can get explicit or overt.
* **Unknown** — the author has chosen to not give the game an age
  appropriateness rating.

The default age-appropriateness rating is "Unknown", which for all practical
purposes has the same meaning as "Explicit". It will be treated as a game
for adults regardless of its actual content since we can't tell the player
what to expect.

The other part of rating is the content warning. This is a free-text field
that includes any warnings the author wishes players to be aware before they
install and play a cartridge, and it's limited to up to 1,000 UTF-16
codepoints.


Runtime
-------

The runtime (or platform) section specifies how Kate should run the
application. Currently Kate only provides one runtime, ``web-archive``,
which can run games packaged for the web.


Web-archive
'''''''''''

The web-archive runtime provides a web-browser-like environment to run the
cartridge. It consists of two configurations:

* ``html``: The starting web page that should be loaded and sandboxed by Kate.

* ``bridges``: Which code needs to be injected in the cartridge process
  to emulate web APIs that the cartridge uses, using the Kate Runtime APIs.