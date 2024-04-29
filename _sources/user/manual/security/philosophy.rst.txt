Safety philosophy
=================

The experience of gaming in a console has always been nice. You can browse
all the catalog of games, pick whatever you like, and just run it. You know
it's going to run reasonably well on your console, and it won't cause any
damages to your device.

Unfortunately, developing for a console has not been historically too
democratic. As an individual it's harder to get your game on a console.
And even when you do, it's not something you can do free of cost. Or for
any small game you wish to publish. In that sense gaming on a computer is
much better.

But gaming on a computer is less than ideal. You start by browing the catalog
of games and choosing the ones you like, as usual. Except that now, rather than rushing
to play it, you're forced to ask yourself a lot of questions:

* Does this run on my OS?
* Does this run on my computer? Without freezing?
* Is this compatible with my graphics card?
* How do I run this on my computer?
* Do I trust the person who made this game?
* Is the person who made this game truly the person I think they are?
* Has the person who made the game had the gamepad/input devices I'm using in mind?
* Will this game damage my computer?
* Will this game try to steal my data?
* Will...

And so on, and so forth. Every time you run a video game on your computer,
on top of all this additional effort from non-standard hardware, there's this
ever looming shadow of "what if this is actually a virus and it does bad things
on my computer?" It's always there, in a way that isn't really a concern in
console gaming.

Kate's safety philosophy is that gaming on a computer should be like gaming
on consoles: pain-free and with very few risks attached. But it should maintain
the same democratic "everyone can publish a video game" aspect computer
games have.


Installing games, safely
------------------------

Installing computer games is tricky. Some games are distributed as a ZIP
archive. Some games are distributed as an installer application. Some 
games are distributed as a collection of files that you need to arrange and run.

But running it is also not consistent. Each OS has its own ways of running
a video game. And each game might have different ways of running itself,
even in the same OS.

And once you install it, you're likely getting several different files
laying around in your computer. You might attempt to modify them—or something
else in your computer might. Or you might end up accidentally deleting some
of them. You might even need to move the folder containing the game files
around. But none of these actions are safe—doing so might corrupt the game
beyond repair, and there's no way to know beforehand if it will.

Worse still: if the game *is* corrupted, there's no way of knowing how you
can make it work again. Simply reinstalling it **might not be sufficient**
because data might be laying around in folders outside of the control of
the installer that make *your entire computer* incompatible with a new
installation!

Kate aims to do away with any lack of safety during installation: you get
exactly one cartridge file, and there's exactly one way of installing and
uninstalling it, regardless of which device or host operating system you use.
Once you install, there are no ways of corrupting the installed game files
by just using your device. Even if you delete data the game has saved after
installation.

How Kate does this is described in the :doc:`cartridges section <../gaming/cartridges>`.


Running a game, safely
----------------------

Computer games are generally not :term:`sandboxed <sandboxing>`. This means that when
they run on your computer they can do anything you, as the computer user,
could do. If you can delete every file in your computer, so can the game.
If you can modify every file in your computer, so can the game. If you can
send things to your friend via a messaging app, the game might be able to
as well.

For legacy applications (e.g.: `.exe` files), which most games still are,
operating systems nowadays require you to think about whether you trust the
developer before you run an application, and they do this by showing a scary
security warning to you, but without giving you any tool to properly assess
the risks.

It's essentially: "hey this might damage your computer, do you want to
proceed?" with the only options being "do not run the game" and "possibly
damage my computer".

Some applications are digitally signed. This requires the developer to
pay a significant amount of money anually to stamp on the `.exe` (or equivalent)
file that they have, in fact, produced that application. But signatures do not
change anything about the problem above.

Operating system vendors are betting on the idea that "if a lot of people run
this without complaining, it's *probably* safe", but that only works if the
game is very popular and you're not the first person to install it. It doesn't
prevent any harm and damage from being caused, but it *might* avoid a scenario
where a lot of users are harmed.

So you have the same problem, but worse: now developers need to pay significant
amounts of money to release their games with a "i made this" seal. You, as the
player, do not get any real security out of this. And you'll still see the same
"hey this might damage your computer, do you want to proceed?" messages.
Everyone loses.

Kate considers that one user harmed is alredy one-too-many. There should be
no harm caused from simply running a game cartridge, ever. To this end,
Kate uses :term:`sandboxing`, which is the same technique mobile phones
use for their apps.

By sandboxing the cartridges Kate ensures that the cartridge **cannot** do
anything that would damage your device (or your data). Even if they try to.
Even if they happen to be malicious. In this case there's no need for
signatures, and there's no need for thinking about whether or not you trust the
developer. You just run the game, the worst thing that could happen is
the game crashing.

How the whole sandbox thing works is described in the
:doc:`sandboxing section <sandboxing>`.


Knowing you *can* play a game
-----------------------------

When you buy a console game you generally expect that it will work with
the console you have—after all, there's only one hardware the developers
need to test on. Console game bugs are generally of the "if you press X
when standing near a cliff and holding a meelee weapon while wearing
a winter outfit during the night in summer, the character animation looks
funky" variety. Which is understandable, as games are very complex nowadays
and it's impossible to test *all* possible things that can happen in it.

Computer games, on the other hand, have the less fun kinds of bugs. A
game may run, but freeze constantly because it doesn't like your specific
graphics card. It might run but immediately crash during cut-scenes because
your monitor just happens to have a higher refresh rate than what the game
supports. It might not recognise your gamepad. It might recognise your
special accessibility device, but only map two of the 5 buttons in it.

It's very easy to buy a game that turns out to be *entirely unplayable*.
Which is a bit more than just a disappointing (or amusing) bug in the
game's logic. And one that developers cannot really do much about. After all,
computers may have a ridiculous amount of different components that they
have no way of testing against.

Kate can't do much regarding hardware incompatibility without controlling
the player's hardware, so it approaches this problem in a different way:
it gives you three baseline hardware versions you can compare your device
against, and have games be tagged with which version they expect. This is
similar to the "system requirements" you see, but a bit more thorough.

This way Kate can take care of testing against all the different hardware
combinations and developers only need to care about up to three of them.

The other way Kate addresses this problem is by supporting *safe* mods
of the console itself. This way, players who need additional support for
accessibility and other things in the console are able to do so. Mods
are subject to the same sandboxing and isolation principle that cartridges
are, both for security and to make sure they can't break the baseline
expectations Kate relies on—otherwise we'd end up in the same place
Windows and Linux are in, where there's no real baseline developers can
expect when publishing their games because every user may have modified
core aspects of their computers.

Going further, Kate also attempts to address problems that are not
technical in nature. Cartridges' metadata can contain information on
content warnings, age rating, supported interaction modes and language,
provided accessibility features, and more. These are used by Kate to
help you find games that you can enjoy given your own personal
context at the moment.

For more details you can check the section on
:doc:`Kate's hardware versions <../intro/hardware>` and how it relates
to the :doc:`emulator requirements <../intro/emulator>`. Mods and
accessibility support guidelines are still not implemented.


Keeping your data safe
----------------------

When you run a video game, or any other application, it's very hard to know
what data it can access. This is true even for phone apps, which are
:term:`sandboxed <sandboxing>`, and thus limited in what they can do.

The issue is worse when a video game (or app) has internet access. Now,
whatever information it has managed to access can travel outside of
your computer and to someone else, without your consent, or, really, even
without your knowledge. Given that people have more of their lives stored
in their computers nowadays, privacy is a much bigger concern now.

There are a few different ways of addressing this problem, but Kate just
picks the simplest one to explain: no cartridge in Kate has access to
the internet, and no cartridge in Kate has access to your device's storage.
In essence, what this means is that the only data a cartridge can read
is what you provide them with, and the only thing they can do with this
data is process locally—they can never make any piece of data leave your device
by themselves—you, specifically, have to give the cartridge more permissions.


Feeling safe by knowing what's happening
----------------------------------------

Computers in general (including consoles) are very complex and very powerful.
But they're generally a kind of black box: there are many things that are
always happening in a computer that you will have no knowledge of. And some
of these things have significant impact on your device's security, your
privacy, and safety.

Operating systems tend to use a screen (and perhaps some additional channels,
such as sounds or LEDs) to let you know about some of these things. For
example, the battery indicator in a phone will let you know when it's safe
to use your phone, and when you should be rushing to find a power outlet
to avoid losing your past 2 hours of work.

Kate takes a very principled approach to these sorts of indicators. In Kate
an indicator should exist to communicate everything potentially unsafe or
that requires more of your attention, and all such indicators should be
impossible to mimic by any cartridge. You should be able to look at the
indicator and immediately know that it's a Kate indicator, and not, possibly,
an application trying to trick you with a very elaborate copy of what your
Kate screen looks like.

To that end Kate introduces the :doc:`Resource Indicator Band <trust>`,
which we discuss in more details in its specific section.


Trust, but safely
-----------------

Although Kate makes several promises about security and privacy, there will
always be the question of whether you can trust these promises or not. This
goes for all software, and all computers and digital devices that you use.
Answering the question is complicated because both hardware and software
have very complex machinery, and you would need to understand all of it,
and all of their implications, before you can answer the question.

This is aggravated by the fact that there's a lot of pieces, particularly
with hardware, that you can't even inspect yourself, and thus have no way
of understanding. No way to independently audit.

Which leaves you with one recourse: trust that whoever is selling you these
pieces of hardware and software has verified that their promises hold. And
that the risks they've communicated are both complete and correct.

But trusting something with no way of verifying it does not fit Kate's
safety philosophy, so Kate takes a different approach to this; one that
allows people to independently verify that Kate's security promises are
solid.

This means that:

* The Kate OS and emulator are open source and independently auditable;
  users can verify what Kate does (and doesn't do) by
  `looking at the code on GitHub <https://github.com/qteatime/kate>`_.

* Kate Native, the Kate Tools, and core cartridges only depend on open source
  software. They're thus are also independently auditable. Kate Native relies on
  GitHub's `Electron <https://github.com/electron/electron>`_ and Google's
  `Chromium <https://www.chromium.org/Home/>`_. Kate Tools relies on
  `Node.js <https://github.com/nodejs/node>`_. By choosing projects with
  dedicated security teams Kate also benefits from the security improvements
  done to them.

* Kate has multiple levels of :doc:`sandboxing <sandboxing>` to ensure that,
  even if there are bugs in the code, or even when running malicious cartridges,
  we can still make some baseline guarantees about your security and privacy.

* Kate engages in :term:`threat modelling <threat model>`, where technical, personal, and
  social risks have to be cautiously assessed for every feature added to Kate.

* Kate uses :term:`formal modelling <formal model>`, where mathematical models are used to
  help design and verify a system, to make sure features added to Kate are
  correct *and* have fewer ways of being broken by an attacker or malicious
  cartridge.

* Kate intends to have mechanically verified :term:`formal proofs <formal proof>` for its
  Kernel, which, at the software level, can help making the Kernel security
  promises more concrete.

* Kate has a `responsible security disclosure policy <https://github.com/qteatime/kate/security/policy>`_,
  where security issues can be privately reported and fixed before they
  can cause wider damage.
