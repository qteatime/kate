==================
Kate Licensing FAQ
==================

Kate started as a MIT-licensed project, and there was previously some reasoning
on `why it needed a stronger copyleft licence <https://github.com/qteatime/kate/pull/22>`_.
This document provides answers to the most common things you may wonder about
regarding Kate's licensing.


What licences does Kate use?
----------------------------

The Kate operating system, the Kate distribution (the native Raspberry Pi
version), and the Kate emulator (the web app and native app for
Windows/Mac/Linux) are all released under, preferably, the GPLv2 (or later).
When linking to Linux kernel services, the GPLv2 version used by the kernel
shall apply. See the next answer for the reasoning behind this.

The core ecosystem cartridges that produce cartridges (the Kate Publisher and
the Kate Importer) are also released under the GPLv2 (or later). These
cartridges need to be auditable to assure developers and players that what
they are running and distributing to their users is, in fact, the data they
have provided to the application **with no added software on top**. This
ensures that even if you get a modified version of these cartridges, you can
still audit it to check if someone added surveillance code (or similar)
that gets copied to your cartridge and shipped to your users.

The example cartridges shipped with Kate are given the most permissible
licence possible. This is usually CC0 or equivalent of public domain.
This is also the licence for automated tests. You can use the code as
basis without having to credit anyone, and with no limitations.

Documentation is released under a Creative Commons No-Derivatives licence.
Some of the illustrations and designs might be shared under a different
licence (this will be stated if it's the case).

Thirdy-party software and resources included in Kate retain their own
licences. These can be MIT, Apache v2, MPL v2, OFL, etc. Check the full
licence for each Kate package for a complete run-down of the licences
involved (this will be in a file called ``LICENCE.txt``).

Cartridges made by third parties and released for Kate all have their own
licences. This licence will be displayed to you when you install the
cartridge, and it might not be the same licence Kate uses.

Finally, the project name, trademarks, logos, and similar are not licenced
to be used outside of Kate, remaining the property of the Kate project
authors. If you're interested in forking Kate and maintaining your own
platform, you'd need to find a different name and visual identity
(we'd also appreciate being clear to your users on what the differences
between your modified version and the standard Kate version is, especially
if they impact security/privacy).


I'm using Kate to play games, how does the licence affect me?
-------------------------------------------------------------

Kate's licence allows you to run, modify, and redistribute Kate freely
and free of charge, as long as you don't prevent anyone else from doing
the same. You also get full access to the source code for Kate (and need to
guarantee anyone you distribute it to also has access to the source code),
including any modifications that were made available to you.

In essence: it's free software both as in gratis and as in freedom. You
don't have to pay to use Kate, and you'll never have to pay to use Kate.
You'll always have access to the source code (along with instructions to
build your own binaries from this source code) so that you can understand
what the software is doing behind the scenes, if you want to.


I'm making cartridges for Kate, how does the licence affect me?
---------------------------------------------------------------

There are two main kinds of cartridges: regular cartridges and Kate OS
extension cartridges. Most cartridges (such as games or apps) fall into the
first category. You'll know which category your cartridge falls into because
making an OS extension cartridge is an additional step you have to take
(you need stronger capabilities and different APIs). The Publisher
application will also tell you if your cartridge is subject to stricter
licensing.

A regular cartridge, which is the vast majority of cases (and all possible
cases today), is not affected by Kate's licence. You, as a developer, has
full liberty to choose how you want to licence your cartridge to players.

There's also a special provision in Kate where you can choose to allow your
players to modify the cartridge for their own use (e.g.: by making and
installing mods), or not.
:ref:`This is something you choose when you create the cartridge <legal build configuration>`,
but the default is that strict personal modifications are allowed
(i.e.: the player can make mods for themselves, but not share them in any form).

A Kate extension cartridge is a special kind of cartridge that uses the more
powerful Kate Kernel API in order to access internal and sensitive data in
the operating system (such as all screenshots of any cartridge, or all play
times of any cartridge), or to modify core aspects of the operating system
itself. These cartridges *must comply to the GPLv2 (or later)*, as the
Kate Kernel API it not included in the special exception for the GPL licence.


I'm modifying Kate, how does the licence affect me?
---------------------------------------------------

If you modify Kate for your own personal/internal use, then the licence does
not affect you in any way. The GPL licence only applies to modifications that
are distributed to other people.

If you distribute your modifications to others, then your modifications will
also be covered by the GPLv2 (or later), and you'll need to make sure that
your recipients can get a copy of the source code including your modifications,
as well as instructions of how to build the application from these source
files. You also need to make it clear that you're distributing a modified
version, as specified in sections 2 of the GPL version 2.


I'm hosting a web instance of Kate, how does the licence affect me?
-------------------------------------------------------------------

If other people can access Kate over your web instance, that counts as
distribution of the software, and it's thus subject to the terms of the GPL.
You should make it clear to the user that the software they're running is
covered by the GPL, and that they can get the source code for it if
they want to.

Unless you've modified the Kate code you're running in your web instance,
the "About Kate" screen will already fulfil these requirements for you.
If you've modified Kate, you'll need to change this screen to point users
towards the copy of the source code that contains your modifications.

Though not required by the GPL, we encourage you to
:doc:`maintain a privacy policy </user/manual/security/privacy>`
for your instance that is easily and publicly accessible to your users.
In some countries
(e.g.: under the `GDPR <https://en.wikipedia.org/wiki/General_Data_Protection_Regulation>`_)
this is a legal requirement, but it's overall good manners to tell users
what you're using their data for and how, even if you're not legally obliged to.

If your modifications change any of the
:doc:`core safety guarantees </user/manual/security/philosophy>` that Kate
provides, we also strongly recommend making this clear to your users,
preferably in simple, short, and direct language.


Why is Kate GPLv2?
------------------

Kate is a low-level system that aims to provide both developers and
users with a set of
:doc:`very strong privacy and security guarantees </user/manual/security/index>`.
Part of these guarantees are supported by design documents, security proofs,
and open standards, but ultimately the *actual* guarantees that are
provided are those implemented in the code users are running! So, instead
of just telling the users "trust me, it's safe", Kate aims to allow users
to audit what they're running and decide for themselves if it meets their
safety and privacy expectations.

In order to be auditable, the core operating system of Kate is intentionally
kept as simple as possible and fully open-source. Fulfilling these two points
is not an issue with the previous MIT licence choice. However, being a
software project that encourages users to modify it and share their
modifications, we also want to make sure that anyone on the receiving end
of these modifications understands *how they change the core guarantees
Kate sets up*. A copyleft licence achieves this by requiring modifications
to the software to be released in the source form, thus addressing our
goal of making them auditable instead of simply trust-based.

Earlier in the project we've experimented with the
`Mozilla Public Licence v2.0 <https://github.com/qteatime/kate/pull/22>`_ as
a middle-ground between the strong copyleft nature of GPL and the permissive
nature of MIT. In this sense, the copyleft requirements would only apply
to changes to the core OS behaviour (which would impact the core safety
guarantees it can provide). Sadly, the MPL turned out to not be enough to
fulfill this intention for two reasons:

* The MPL covers changes *to specific source files*, which is generally
  reasonable. However, since Kate is mostly written to be run by a web
  browser, it's possible to completely change the behaviour of Kate without
  touching any of Kate's source files, thus those modifications would not be
  covered by the MPL requirement to make them available in auditable source form.

  This same possibility is what powers most of Kate's own
  :doc:`Bridges </dev/manual/web/bridges/index>`, used to change the behaviour
  of core web APIs to allow previous web-oriented games to work in Kate, so it
  is quite unfortunate that it was missed in the previous licence assessment.

* We want to allow extensions to the OS in the form of cartridges you can
install the normal way in the future. These would change core OS behaviour
while not being changes to specific MPL-marked files; thus there would
be no requirement for them to be auditable.

  The GPL provides good provisions to make these extensions covered as well
  since it takes any form of linking into consideration. We provide a special
  exception for linking to Kate without being subject to the GPL, as long as
  the cartridge only uses the Kate Runtime API
  (the only API available currently).


Can I release a cartridge under a proprietary licence?
------------------------------------------------------

For the vast majority of cartridges: yes. There's a special provision to
exempt cartridges linking against the Kate Runtime API from being subject to
the GPL, so for any regular cartridge (which will likely include all
video games), you don't have to worry about the licence---it is whatever you
choose, as long as it's compatible with the software you're
distributing yourself.

Cartridges that only link with the Kate Runtime API have their security
and privacy characteristics enforced by the Kate OS, thus there's less of
a need for users to audit them. The risks users are taking with running the
cartridge are already communicated in the form of capabilities, and we can get
meaningful consent by having users review the capabilities the cartridge requires.

Cartridges that are meant to be extensions or modifications to the Kate
operating system itself (e.g.: an OS driver that adds support to new gamepads,
a visual theme, a widget that summarises play habits data, etc.), and thus
change core OS behaviour by linking to the (as of yet unreleased)
Kate Kernel API, will need to comply with the GPL. This is in line with the
explanation in the answer above regarding auditing of the security guarantees in Kate.

If your cartridge *would* be subject to the GPL, you'll be warned by the
Publisher when creating the cartridge (along with an explanation of why),
so you don't have to worry too much about the licencing upfront. You cannot
make a cartridge "accidentally subject to the GPL".


If Kate can be accessed via web, why not use AGPL?
--------------------------------------------------

The AGPL is intended for software that is offered as a service over a
network. Kate, on the other hand, works fully offline---it just so happens
that its "binary executable form" is distributed over a network and can
be ran without having to install it natively first. As such,
the GPL is the correct licence for Kate.

A server providing a version of Kate over the network makes their
entire web page covered by the GPL. This means that they must provide the
source code for any modifications they make to Kate, and any additional
software they link with Kate, which is in line with the intention of using
a copyleft licence here: what you ultimately run *on your machine* is auditable.

Do note that there's no way, and no legal recourse, to enforce a random web
server to comply with Kate's security and privacy policies otherwise.
There's no provision for what a server is allowed to do or not with data
you provide them. Even if a server discloses the source code for the version
of Kate they're distributing, the server may still collect personal data
and track users across the web without being in violation of the licence.
This is why we only provide a privacy policy for Kate's own public instance,
and recommend anyone not wanting to trust it
:doc:`to run their own web instance of Kate <running your own kate instance>`.
