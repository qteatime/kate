Configuration files
===================

Kart relies on a JSON configuration file (commonly named ``kate.json``)
to describe how to create the cartridge and what to include in it.

This configuration is made out of the following sections:

* ``id`` — a string with the cartridge identifier. Follows rules specified
  in :ref:`Cartridge Identification`;
* ``metadata`` — information used to display and filter the cartridge in the
  Kate library;
* ``files`` — describes which files to include in the cartridge file;
* ``platform`` — describes how to run the cartridge;


File location
-------------

The ``kate.json`` configuration file is generally placed in the root of
your game directory—that is, at the same level as your HTML entrypoint:

.. code-block:: text

  +--.
     |
     |---o kate.json
     |---o kate-thumbnail.png
     |---o index.html
     |---+ images/
     `---+ audio/

But sometimes it makes sense to place the configuration file outside of
your game's root directory. For example, Ren'Py web distributions modify
the contents of the whole game directory, so you'll want to have the Kate
files somewhere Ren'Py won't touch:

.. code-block:: text

  +--.
     |
     |---o kate.json
     |---o kate-thumbnail.png
     `---+ renpy-game-1.0-web
         |
         |--o index.html
         |--o game.zip
         |--+ game/
         (...)

To accomodate these cases, the configuration file accepts a ``root`` option,
which changes the root directory of the game to a different folder contained
in the directory holding the ``kate.json`` file [#f1]_.

When using this option, a configuration file looks like this:

.. code-block:: json
  :force:

  {
    "id": "namespace/game",
    "root": "renpy-game-1.0-web",
    ...
  }

.. [#f1] Kart does not allow the ``root`` option to point to a directory
  that's unrelated to the ``kate.json`` directory for security reasons.
  If you were to run Kart on a configuration file you didn't write, that
  configuration would be able to instruct Kart to read and include in the
  cartridge sensitive files from your computer, which the cartridge could
  then access when you run it.


Metadata
--------

The metadata section is further divided into several subsections:

* ``game`` — provides information about the game itself, including how to
  display and categorise it in the library;

* ``release`` — provides information about the distribution of the cartridge.
  This includes the version, terms of use, and any legal notices from
  third-party assets that the cartridge includes;

* ``rating`` — provides information about the appropriateness of the contents
  of the cartridge. This includes age-appropriateness ratings and content
  warnings;

* ``play_style`` — provides information about how the game is played. This
  includes what controls it supports, what language it offers, whether it
  supports multi-play, accessibility provisions, etc;


Game
''''

author *(recommended)*
  | ``string``
  | A descriptive name identifying who made the game. Will show up on stores
    and in the detailed cartridge information screen. Up to 255 characters [#f2]_.

title
  | ``string``
  | A descriptive name identifying the game itself. Will show up under the
    cartridge's thumbnail in the library, and everywhere else the cartridge
    is displayed. Up to 255 characters [#f2]_.

description *(optional)*
  | ``string``
  | A free-text description of the game. Might include a summary, features
    players might expect, and similar text to what is generally found in
    game stores. Up to 10,000 (ten thousand) characters [#f2]_.

genre *(recommended)*
  | ``array of string``
  | A list of genres that the game might be classified as, with a maximum of
    10 items. This is used for organising the cartridge library and allow
    players to search for things they want to play.

  The list of genres is pre-defined and can be one of the following:

  * ``action``
  * ``fighting``
  * ``interactive-fiction``
  * ``platformer``
  * ``puzzle``
  * ``racing``
  * ``rhythm``
  * ``rpg``
  * ``simulation``
  * ``shooter``
  * ``sports``
  * ``strategy``
  * ``tool``
  * ``other``

  The default is ``other``, if no list of genres is provided.

tag *(optional)*
  | ``array of string``
  | A list of additional tags that help players search for cartridges and
    organise their library.

  Each tag can have up to 255 characters [#f2]_, and must consist entirely
  of lower-case latin letters and hyphens. E.g.: ``visual-novel`` is a
  valid tag, but ``visual novel`` is not, because of the white space.
  Neither is ``café-simulator``, because of the accent on ``e``.

thumbnail_path *(recommended)*
  | ``string``
  | A path to a PNG image to use as the cartridge cover when displaying
    the cartridge across Kate. The path is relative to the root defined in
    the configuration file.

  The image should have a 4:7 aspect ratio, and the recommended resolution
  is 400x700 pixels.


Release
'''''''

kind *(recommended)*
  | ``string``
  | Tells players what kind of stability and polish they should expect from
    the cartridge. The default is ``full``, which means a proper, stable and
    polished release.

  Can be one of:

  * ``prototype`` — the game is more of a proof-of-concept than an actual game.
    Players shouldn't expect polish, stability, or completeness of the contents.

  * ``early-access`` — the game is being released to gather early feedback.
    Players should expect a less polished, less stable, and incomplete
    experience.

  * ``beta`` — the game is complete, but looking for more feedback and testing.
    Players should expect a more polished and complete experience, but they
    should expect there to be bugs.

  * ``demo`` — the game is a portion of a bigger vision, but this portion is
    complete in this release. Players should still expect a polished and stable
    experience.

  * ``full`` — this is for proper stable releases. Players should expect full
    releases to be polished, complete, and stable.

date *(optional)*
  | ``{year: integer, month: integer, day: integer}``
  | The date in which the cartridge was released. Defaults to the current
    date. This helps players sort store entries and their library by
    recency, or look for releases in a particular time-frame.

  E.g.: ``{year: 2023, month: 6, day: 10}``

version
  | ``{major: integer, minor: integer}``
  | The version of the cartridge. Must be unique per release, since Kate will
    do nothing if a player tries to install a cartridge when there's something
    with the same id and version already installed
    (even if the contents differ). See :ref:`Cartridge Versioning` for details.

  E.g.: ``{major: 1, minor: 13}``

legal_notices_path *(recommended)*
  | ``string``
  | A path to a text file describing the terms of use of the cartridge and
    any additional credits or licences for data that the cartridge uses.
    This is the place where you should e.g.: put licences from assets and
    code that you use in your game, but which was not made by you.

  Kate will allow players to read through this file from the cartridge's
  context menu. See :ref:`Cartridge Usage Terms` for details.

licence_name *(recommended)*
  | ``string``
  | If the cartridge is released in an open source licence, this should
    contain the `SPDX licence id <https://spdx.org/licenses/>`_ for the
    licence you use. Otherwise it's ``proprietary``, which is the default.

allow_derivative *(optional)*
  | ``boolean``
  | This tells players if they can modify the cartridge and share these
    modifications, e.g.: by making mods. The default is ``false``, so
    players are not allowed to make mods.

allow_commercial *(optional)*
  | ``boolean``
  | This tells players if they can profit **from modifications** of the
    cartridge, e.g.: by making mods and selling them. The default is
    ``false``, so players are not allowed to profit from cartridge
    modifications.


Rating
''''''

rating *(recommended)*
  | ``string``
  | The age-appropriateness rating of the cartridge, based on the author's
    perspective. You should provide this, the default is ``unknown``, which
    is treated in the same manner as ``explicit``, and therefore considered
    adult-only content regardless of what the actual cartridge is.

  Can be one of:

  * ``general`` — for everyone;
  * ``teen-and-up`` — 13+;
  * ``mature`` — 17+;
  * ``explicit`` — 18+;
  * ``unknown`` — not rated, but same as ``explicit``.

  See :ref:`Cartridge Content Rating` for details.

warnings *(recommended)*
  | ``string``
  | This is a free text (up to 1,000 characters [#f2]_) where you can provide
    any warnings to the player about the content so they can make a more
    informed choice about playing it and avoid dangerous situations. The text
    will be shown as-is to players on the store and on the cartridge details
    page, as well as before installing or playing it for the first time.
  
  We expect at least warnings for :term:`common triggers`, as these can start a
  panic attack episode on players suffering from some form of trauma, or lead
  to other medical emergencies such as :term:`epileptic seizures`.


Play style
''''''''''

input_methods *(recommended)*
  | ``array of string``
  | A list of methods that players can use to control the game. This allows
    players to decide if they can play your game or not, e.g.: because they
    lack a device you require, or because they have specific accessibility
    needs.

  We encourage developers to provide fallback methods where reasonable and
  possible. For example, in a game that uses a mouse/pointing device, you
  can provide support for using the d-pad to approximate that experience
  for players who can't use precise pointing devices.

  Can be one of:

  * ``kate-buttons`` — the game can be played using the Kate gamepad;
  * ``pointer`` — the game can be played using a pointing device, such as mouse;

languages *(recommended)*
  | ``array of {iso_code: string, interface: boolean, audio: boolean, text: boolean}``
  | A list of languages that the game offers support for, as well as what
    is supported in that language.

  The language is described by its
  `ISO 639-1 code <https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes>`_,
  and the additional booleans specify what is supported in that language.
  ``interface`` means that the GUI is translated, ``audio`` means that
  voices are translated, and ``text`` means that the game offers subtitles
  and other text in the language.

accessibility *(recommended)*
  | ``array of string``
  | A list of accessibility provisions that the game offers to allow more
    players to play the game. We always encourage developers to look into
    ways of making their games more accessible. This setting helps players
    who need accessibility options to filter items in the store to those
    they can play. The `Xbox Acessibility Guidelines <https://learn.microsoft.com/en-us/gaming/accessibility/guidelines>`_
    are a good resource to get more familiar with accessibility in
    video games.

  Can be one of:

  * ``high-contrast`` — helps players with low vision.
  * ``subtitles`` — helps players who can't rely on audio or have problems understanding the language.
  * ``image-captions`` — helps players who rely on a screen reader.
  * ``voiced-text`` — helps players who rely on a screen reader or have trouble reading text.
  * ``configurable-difficulty`` — helps players who wish to complete the game
    but find themselves unable to cross the game's difficult barrier.
  * ``skippable-content`` — helps players who may have little time to play or
    different interests in what they want out of the game.

average_duration *(recommended)*
  | ``string``
  | An estimation of the amount of time that it takes to complete one run of
    the game, but not necessarily doing all of the things the game offers.
    This helps players looking for something to play to consider what
    their options are for the free time they have at the moment.

  Can be one of:

  * ``seconds``;
  * ``few-minutes``;
  * ``half-hour``;
  * ``few-hours``;
  * ``several-hours``;
  * ``unknown``;

  The default is ``unknown``.

  
.. rubric:: Footnotes

.. [#f2] Kart counts the :term:`UTF-16 codepoints`. So one character might
  count as multiple ones (e.g.: Japanese characters and emojis often count
  as two or more characters).


Files
-----

The files section is a list of :term:`glob patterns` that define which
files should be included in the cartridge. The root directory for searching
these files is the one specified for the cartridge configuration.


Platform
--------

The platform section defines how to run the cartridge. Currently it only
supports the ``web-archive`` platform, which runs games from an HTML web
page. The :doc:`Web game support section </dev/manual/web/index>` describes
this in detail.


Web Archive
'''''''''''

html
  | ``string``
  | A path to the HTML page that should be loaded when the cartridge is ran.
    This is relative to the root directory speficied in the cartridge
    configuration.

bridges *(optional)*
  | ``array of Bridge``
  | A list of bridges that should be injected in the cartridge process when
    it's executed to make it work in the Kate platform. For the available
    bridges and how to configure them, see the
    :doc:`Bridges section </dev/manual/web/bridges/index>`.

  By default no bridge is included.

recipe *(optional)*
  | ``Recipe``
  | If given, this should be a porting recipe that Kart knows about. Recipes
    can do the heavy lifting of configuring Kart for games made with common
    engines. You should look at the :doc:`Kate Porting Recipes book </dev/port/index>`
    for details.

  



