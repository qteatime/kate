Glossary
========

A
-

.. glossary::
  :sorted:

  Analog button
    A button that also reports "how pressed" it is. Kate has two analog
    buttons: |btn_l| and |btn_r|. They're also known as "triggers".
    Analog input allows games to support things like "press it gradually
    to zoom", where the zoom level would be based on how much the button
    is pressed.

  Archiving
  Archiving (a cartridge)
    Removing the cartridge files from the local database to free up space,
    but keeping enough information around to re-install it at a later point
    and continue from where you left off. Similar to the same feature in
    phones and other consoles.


C
-

.. glossary::
  :sorted:

  Copy-protection
    A mechanism designed to prevent digital content from being copied
    and shared, usually present in console games and digital videos.
    Kate does not have any form of copy-protection; Kate cartridges
    can be copied freely, however we expect players to respect
    developers' wishes regarding sharing of their games.

  Codec
    Encoder/Decoder. A piece of software or hardware that enables storing
    and reading information in a specific format. The term is often used
    when discussing video formats, and there it refers to what algorithm
    is used to store and read information in the video file.

  CSS
    Cascading Style Sheets. A programming language that allows one to
    describe the presentation aspects of elements in a :term:`HTML` page.
    See the `MDN docs on CSS <https://developer.mozilla.org/en-US/docs/Web/CSS>`_
    for a more detailed treatise.

  Command line
  Command-line interface
    A form of interacting with a computer by typing issuing text-based commands.
    Command-line interfaces are still in heavy use in programming tools,
    particularly due to their flexibility and ease of automating processes
    that combine many of them together.

  Capabilities
  Capability security
    A computer security model where programs can only do things that users
    have explicitly allowed them to—by assigning "capabilities" to them.
    For example, a program that wants to access the device's camera would
    need to ask the user to grant it the "camera-access" capability first.

  CSP
  Content Security Policy
    A directive that sites can provide to browsers when being loaded in order
    to *reduce and restrict* their privileges, in order to prevent third-party
    code that's loaded with them to have access to—and abuse—these powers.
    See the `MDN docs on CSP <https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP>`_
    for a more detailed treatise.

  Code translation
  Compilation
    A process that translates code intended to be interpreted by one platform
    into code that will be interpreted by another platform, while preserving
    the meaning and behaviour of the code (its semantics). In Kate this
    often happens when running a cartridge containing code meant to run
    in a web browser—the Kate code translator will go through that cartridge's
    code and automatically change it to fit what works in the Kate platform.

    Contrast with :term:`runtime emulation`.

  CSS selector
    A program in the :term:`CSS` language which allows one to search a
    web page for specific elements. For example, the selector
    ``article img`` finds all image elements within article elements.
    
    See the
    `MDN docs on CSS selectors <https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors>`_
    for a detailed treatise.


D
-

.. glossary::
  :sorted:

  Digital button
    A button that has exactly two states: "pressed" and "not pressed". Most
    buttons in the Kate gamepad are digital.


  DOM
    Document Object Model. A model constructed from an HTML text through
    which programs can interact with the elements that make up a web page.
    See the `MDN page on DOM <https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model>`_
    for details.

  DOM pointer events
    Events related to activity in a pointing device, such as a mouse. The
    DOM pointer events cover movement of the pointer and pressing/releasing
    of buttons in the pointing device. See the
    `MDN page on pointer events <https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events>`_
    for details.

  DOM keyboard events
    Events related to the activity in a keyboard device (physical or virtual).
    The keyboard events cover keys being pressed or released. See the
    `MDN docs on keyboard events <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent>`_
    for details.

  DOM trusted events
    Events that are emitted by the browser itself in response to an user
    action, as opposed to an event emitted by the web page's script.

  Data URL
    A format for encoding any piece of data or file as regular URLs that
    are used by web browsers. Because the URL already contains the entirety
    of the data that the browser needs to load, there's no need for the
    browser to reach out to any server to ask for more data. See the
    `MDN docs on data URLs <https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs>`_
    for a more detailed treatise.


E
-

.. glossary::
  :sorted:

  Emulator
    An application that can run applications made for different devices,
    by tricking the application into thinking it's running in the device
    it was made for. Kate's emulator allows playing games made for Kate's
    hardware on a web browser, Windows, Linux, MacOS, Raspberry Pi,
    SteamDeck, and more.


F
-

.. glossary::
  :sorted:

  Fantasy console
    A gaming console that could exist, but for which there's no hardware
    you can just walk into a store and buy. Though you could build the
    console yourself from the technical specification, games are generally
    played on an :term:`emulator` for the console.

  Formal model
    A mathematical model of a software. Kate uses these mathematical
    models to help design a system that is secure, by making sure
    features in the emulator can only interact in few known ways;
    and verify that security, by having a specification of all the
    things that are allowed to happen and when, which can then be
    used as a comparison point when testing.

  Formal proof
    A form of :term:`formal model` that focuses on describing particular
    properties. Kate's use of formal proofs is aimed at checking that
    the emulator does deliver on the security promises that it makes.

  File system
    A form of organising data that is based on the idea of files. Generally
    these are organised in an hierarchy of folders, as commonly seen in
    Windows, MacOS, and Linux. In Kate, file systems do not contain any
    concept of folders, but rather have these files managed through
    a unique identifier, closer to :term:`object storage` systems.


G
-

.. glossary::
  :sorted:

  Glob pattern
    A pattern for recognising file names that can use placeholder characters
    (called wildcard) to stand in for portions of the name, that way allowing
    one to refer to many different files by specifying only the parts of the
    name that are common among them.

    Kate supports ``*`` as a wildcard character that matches anything in the
    name of a file or directory, and ``**`` as a wildcard character that
    matches any number of directories. For example, ``**/*.wav`` matches
    ``click.wav``, ``audio/close.wav``, and ``gui/sfx/chapter1/start.wav``,
    but not ``open.wave``, since the wildcard only applies to the text before
    the ``.wav`` suffix.


H
-

.. glossary::
  :sorted:

  HTML
    A programming language that allows one to describe an interactive
    document comprised of smaller elements, such as text, videos,
    forms, and programs in other programming languages such as :term:`CSS`
    or JavaScript. See the `MDN docs on HTML <https://developer.mozilla.org/en-US/docs/Web/HTML>`_
    for a more detailed treatise.



M
-

.. glossary::
  :sorted:

  Mechanical verification
    A way of verifying that a :term:`formal proof` looks correct by using
    a computer. Note that mechanical verification only tells that the proof
    is consistent with its mathematical definition, but not that the proof
    *makes sense*. Human oversight will always be needed to verify that
    what is being verified is sensible and useful.

  Malicious cartridge
    A cartridge that contains a computer program meant to cause harm
    to its users. E.g.: it could try to tamper with your files,
    trick you into providing sensitive information, or scam you out of
    money.

    Kate uses :term:`sandboxing` to prevent material damage a malicious
    cartridge could cause, even if you end up installing and running one
    on accident.

  Media type
  MIME type
    An identifier that describes the format of a piece of data, consisting
    of a type and a subtype. E.g.: ``audio/wav`` has type "audio" and
    subtype "wav". Applications handling data can rely on this description
    to decide how to interpret the contents.

    Many media types are registered as standard and published by the
    Internet Assigned Numbers Authority (IANA).

  Monotonic timestamp
    A value representing an instant in time that only moves forward. Date
    and time in computer generally models social notions of time, where
    one needs to care about things such as Daylight Savings Time,
    or any other event where synchronising the computer's clock with
    everyone else's requires us to move the clock backwards.

    Because monotonic timestamps never move backwards (i.e.: they don't
    represent an actual time such as "13:29 on 10th May 2023", but rather
    a more abstract notion of a point in time), they can be better used
    for calculating the relative duration of something. In Kate this is
    often used to know how many milliseconds a frame took to render in
    order to properly schedule updates in a game.


O
-

.. glossary::
  :sorted:

  Open-Source
    A computer program that has its program source available for anyone
    to read, as well as the freedom to redistribute and build upon it.
    The OSI has a `long definition of Open-Source <https://opensource.org/osd/>`_.
    Kate and all third-party components that Kate uses are open-source,
    and we consider this
    :doc:`a very important part of Kate's security <user/manual/security/philosophy>`.

  Object storage
    A form of data storage where data is managed as objects—in this context,
    a piece of data that is identified by some unique reference, and possibly
    has some meta-data associated with it. This is different from a hierarchical
    file system storage, where data is organised in a hierarchy of folders
    and files.

  Origin
    A identification of the provenance of some content on the web. This is
    made out of the scheme (e.g.: ``https``),
    the hostname (e.g.: ``qteati.me``), and the port used to load the
    resource. For example, for the web version of the Kate emulator, the
    origin would be ``https://kate.qteati.me``.


P
-

.. glossary::
  :sorted:

  Play habits
    Information about what and how you play your cartridges. Kate stores
    this locally in your device if you have the feature enabled, and
    uses the information to sort games in your library.
    
    The :doc:`play habits section <user/manual/gaming/play-habits>`
    describes it in details.

  Pointer (input)
    An input device that allows one to interact with a portion of the screen
    that the device is "pointing" to. Common examples include mouse,
    trackpads, and styluses. Less common ones include assistive technology
    such as eye tracking. Kate also supports touch input as a form of
    pointer input.

  Personally identifiable information
    Any piece of data that can be used to identify a single individual.
    Things like your name or where you live count as
    "personally identifiable information".

  Sandboxed IFrame
    A browser security mechanism that allows iframes loaded in a web site
    to have less privileges than normal, or to dissociate them completely
    from the site even if their :term:`origins <origin>` match. Kate uses
    this extensively to make sure cartridge processes cannot do anything
    with the data entrusted to Kate.


R
-

.. glossary::
  :sorted:

  Responsible security disclosure
    A process for communicating security-impacting bugs that aims to mitigate
    harm from having more people know about the bugs before users can
    update to a version where the bug is fixed. Kate has a responsible
    security disclosure policy where security-impacting bugs should be
    reported privately to the developers, and only made public after
    the bug is fixed and a new version is released.

  Resource indicator band
    A small area of the screen used by the Kate emulator to show
    security/privacy-impacting things happening at the moment in
    the console, such as having your screen recorded.

    See :doc:`the resource indicators section <user/manual/security/indicators>`
    for details.

  ROM
    Read-Only Memory. A bunch of data that you can read, but not modify.
    In Kate this generally refers to a
    :doc:`ROM cartridge file <user/manual/gaming/cartridges>`.

  Runtime
    A program that is responsible for providing features used by another
    program at the time it's running. In Kate, runtimes generally describe
    a broad set of APIs and supporting functionality that allows cartridges
    to run.

  Runtime emulation
    A process of running programs made for a different platform without
    changing the code of the program. Runtime emulation instead changes
    the current platform to resemble the one the program expects to run
    on.

    Contrast with :term:`code translation`.

S
-

.. glossary::
  :sorted:

  Sandboxing
    Running a computer program in a "restricted area". The intent of
    sandboxing is to limit damage (both accidental and intentional) that
    a computer program may cause. Kate has
    :doc:`multiple levels of sandboxing <user/manual/security/sandboxing>`
    to provide a secure gaming experience.

  Standard gamepad
    A gamepad with, at least, a d-pad, four digital buttons on the right
    (e.g.: A, B, X, Y), two joysticks, four shoulder buttons
    (e.g.: L1, L2, R1, R2), and three center buttons
    (e.g.: Menu and Capture).

    The term is defined by `the W3 gamepad specification <https://www.w3.org/TR/gamepad/#dfn-standard-gamepad>`_.

  Save data
    Any data that a cartridge stores while running.
    See the :doc:`save data section <user/manual/gaming/save-data>` for
    details.

  Storage partition
    Save data in Kate is divided into partitions. A partition is an area
    where data can live, and Kate uses these divisions both for security
    and safety. For example, cartridges cannot access data from a different
    cartridge because it's stored in another partition, which it has no
    access to. Even within a cartridge, there are partitions for each
    version, so you can safely upgrade or downgrade a cartridge without
    worrying about your data being corrupted, or without being able
    to change your mind and going back to the previous version.

  Spoofing attack
    In the context of Kate, a type of attack where a malicious cartridge
    gains access and privileges to the victim's device by tricking them
    into believing they're granting access and privileges to someone
    they trust. E.g.: a malicious cartridge might choose a name
    like ``6reath`` in the hopes that users will be distracted enough
    to mistake the ``6`` for the ``b`` in the trustworthy cartridge
    ``breath``.

    Kate relies on players being able to distinguish things like
    cartridge identifiers to be able to assign privileges to them, and
    mitigates this type of attack by reducing the possible symbols
    attackers can use to trick people based on their visual similarity.


T
-

.. glossary::
  :sorted:

  Threat model
    A document that outlines all known risks of using a software, from
    multiple perspectives, and describes how the software mitigates
    those risks. If a risk is accepted, it also describes why the risk
    is accepted.

    A threat model is a technical document, in general, but Kate's threat
    model is written with examples to make it more accessible to the
    general public.

  Trust frame
    A distinct visual element that Kate uses to tell players when a
    potentially dangerous dialog comes from the Kate emulator itself,
    rather than a malicious cartridge trying to trick players.

    See the :doc:`trust and consent section <user/manual/security/trust>`
    for details.


V
-

.. glossary::
  :sorted:

  Virtual button
    A button that is shown on a touch screen to stand-in for what would be
    a physical button. The Kate emulator provides virtual buttons for all
    of the Kate gamepad, allowing it to be used in a smartphone or similar
    touch-only device.

