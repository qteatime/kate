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

* The **File system**, which provides Kate with all data that makes up the
  cartridge; and

* The **Runtime**, which provides Kate with information about how to run the
  cartridge.


Identification
--------------

Each cartridge has a unique identifier, which is written in the form:
``namespace/name``. Here ``namespace`` is a domain name that you own,
whereas ``name`` is a name that must be unique in that namespace.

For example, the author's game is identified by ``qteati.me/the-sound-of-rain``.
This means that they have a game named ``the-sound-of-rain``, and this
is published by someone who owns the domain ``qteati.me``. Having domains be
something authors own makes it easier for Kate to do automatic verifications
about the origin of a cartridge, improving users' trust.

You can use something like ``your-username.itch.io`` if you don't own a
top-level domain. This is a less strong guarantee for origin verification,
but for Kate's use cases it's often good enough.

.. important::

   Namespaces and names can only contain lower-case latin letters, hyphens, and
   dots. Each side must have at least one letter, and the whole identifier
   cannot exceed 255 characters. These restrictions are used
   to prevent :term:`spoofing`, where an attacker chooses a
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
collections. It will also be used by other tools (such as the store feed
ones) to extract information necessary to present a cartridge.

The meta-data is itself divided into further sections:

* **Title**: This provides information about the cartridge presentation, such
  as the title of the game, the thumbnail to use, etc;

* **Release**: This provides information about when the game was released, what
  kind of stability players should expect, and any usage terms;

* **Rating**: This provides information about the content of the cartridge,
  such as age appropriateness and content warnings;

* **Play**: This provides information about how the game is played, such as
  accessibility and translation provisions;


Versioning
----------

Each cartridge has a release version, using a ``<major>.<minor>`` format
(e.g.: ``5.2``). Kate only allows one version of each cartridge to be
installed at any given time.

When a player tries to install a cartridge that has the same version
as the one already installed, Kate will just skip the installation altogether,
so you're expected to change the version every time the contents of the
cartridge change.

When a player tries to install a cartridge that has a different version
already installed, they will be prompted about upgrading or downgrading
the cartridge. When using versioned save data, downgrades are always
safe.


Usage terms
-----------

A cartridge metadata includes the terms of using the cartridge. This comes in
the form of a legal notices text, which is then made available to players in
the console through the context menu.

Cartridges may also include additional provisions for using the cartridge.
Open source games can declare which open source licence applies. And games
with relaxed usage can declare if players are allowed to modify the cartridge
(e.g.: by making mods), and whether they're allowed to make commercial use
of their modification.

The defaults are those of a restrictive proprietary
policy, with some provisions for personal modifications. The reason personal
modifications are allowed by default is that players with particular
accessibility needs may need to make modifications to be able to play at
all.


Rating
------

All cartridges are expected to provide an age appropriateness rating and
necessary content warnings. Failing to do so might cause the cartridge to
be hidden from the official channels, or require the player to agree to
possibly explicit content before they can install and play.

Rating is made out of an age-appropriateness rating, from the author's
perspective and not governed by any regulatory body, which can be one of:

* **General** — the author sees it as appropriate for any audience;
* **Teen-and-up** — the author thinks the game is not appropriate for
  kids aged 12 and younger;
* **Mature** — the author thinks the game is only appropriate for adult
  audiences. It may include depictions of violence, sex, abuse, and other
  heavy topics, but there's nothing very graphic;
* **Explicit** — like mature, except things can get graphic.
* **Unknown** — the author has chosen to not give the game an age
  appropriateness rating.

The default age-appropriateness rating is "Unknown", which for all practical
purposes has the same meaning as "Explicit". It will be treated as a game
for adults regardless of its actual content, so players can give their
informed consent.

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
  to emulate web APIs that the cartridge uses, using the Kate APIs.