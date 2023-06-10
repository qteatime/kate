Glossary
========

.. glossary::
   :sorted:

   Fantasy console
      A gaming console that could exist, but for which there's no hardware
      you can just walk into a store and buy. Though you could build the
      console yourself from the technical specification, games are generally
      played on an :term:`emulator`` for the console.
   
   Emulator
      An application that can run applications made for different devices,
      by tricking the application into thinking it's running in the device
      it was made for. Kate's emulator allows playing games made for Kate's
      hardware on a web browser, Windows, Linux, MacOS, Raspberry Pi,
      SteamDeck, and more.

   Copy-protection
      A mechanism designed to prevent digital content from being copied
      and shared, usually present in console games and digital videos.
      Kate does not have any form of copy-protection; Kate cartridges
      can be copied freely, however we expect players to respect
      developers' wishes regarding sharing of their games.

   Virtual button
      A button that is shown on a touch screen to stand-in for what would be
      a physical button. The Kate emulator provides virtual buttons for all
      of the Kate gamepad, allowing it to be used in a smartphone or similar
      touch-only device.

   Pointer (input)
      An input device that allows one to interact with a portion of the screen
      that the device is "pointing" to. Common examples include mouse,
      trackpads, and styluses. Less common ones include assistive technology
      such as eye tracking. Kate also supports touch input as a form of
      pointer input.

   Digital button
      A button that has exactly two states: "pressed" and "not pressed". Most
      buttons in the Kate gamepad are digital.

   Analog button
      A button that also reports "how pressed" it is. Kate has two analog
      buttons: |btn_l| and |btn_r|. They're also known as "triggers".
      Analog input allows games to support things like "press it gradually
      to zoom", where the zoom level would be based on how much the button
      is pressed.

   Standard gamepad
      A gamepad with, at least, a d-pad, four digital buttons on the right
      (e.g.: A, B, X, Y), two joysticks, four shoulder buttons
      (e.g.: L1, L2, R1, R2), and three center buttons
      (e.g.: Menu and Capture).

      The term is defined by `the W3 gamepad specification <https://www.w3.org/TR/gamepad/#dfn-standard-gamepad>`.

   ROM
      Read-Only Memory. A bunch of data that you can read, but not modify.
      In Kate this generally refers to a
      :doc:`ROM cartridge file <user/manual/gaming/cartridges>`.


   Archiving (a cartridge)
      Removing the cartridge files from the local database to free up space,
      but keeping enough information around to re-install it at a later point
      and continue from where you left off. Similar to the same feature in
      phones and other consoles.

   Sandboxing
      Running a computer program in a "restricted area". The intent of
      sandboxing is to limit damage (both accidental and intentional) that
      a computer program may cause. Kate has
      :doc:`multiple levels of sandboxing <user/manual/security/sandboxing>`
      to provide a secure gaming experience.

   Open-Source
      A computer program that has its program source available for anyone
      to read, as well as the freedom to redistribute and build upon it.
      The OSI has a `long definition of Open-Source <https://opensource.org/osd/>`.
      Kate and all third-party components that Kate uses are open-source,
      and we consider this
      :doc:`a very important part of Kate's security <user/manual/security/philosophy>`.

   Codec
      Encoder/Decoder. A piece of software or hardware that enables storing
      and reading information in a specific format. The term is often used
      when discussing video formats, and there it refers to what algorithm
      is used to store and read information in the video file.

   Play habits
      Information about what and how you play your cartridges. Kate stores
      this locally in your device if you have the feature enabled, and
      uses the information to sort games in your library.
      
      The :doc:`play habits section <user/manual/gaming/play-habits>`
      describes it in details.

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

   Resource indicator band
      A small area of the screen used by the Kate emulator to show
      security/privacy-impacting things happening at the moment in
      the console, such as having your screen recorded.

      See :doc:`the resource indicators section <user/manual/security/indicators>`
      for details.

   Malicious cartridge
      A cartridge that contains a computer program meant to cause harm
      to its users. E.g.: it could try to tamper with your files,
      trick you into providing sensitive information, or scam you out of
      money.

      Kate uses :term:`sandboxing` to prevent material damage a malicious
      cartridge could cause, even if you end up installing and running one
      on accident.

   Threat model
      A document that outlines all known risks of using a software, from
      multiple perspectives, and describes how the software mitigates
      those risks. If a risk is accepted, it also describes why the risk
      is accepted.

      A threat model is a technical document, in general, but Kate's threat
      model is written with examples to make it more accessible to the
      general public.

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

   Mechanical verification
      A way of verifying that a :term:`formal proof` looks correct by using
      a computer. Note that mechanical verification only tells that the proof
      is consistent with its mathematical definition, but not that the proof
      *makes sense*. Human oversight will always be needed to verify that
      what is being verified is sensible and useful.

   Responsible security disclosure
      A process for communicating security-impacting bugs that aims to mitigate
      harm from having more people know about the bugs before users can
      update to a version where the bug is fixed. Kate has a responsible
      security disclosure policy where security-impacting bugs should be
      reported privately to the developers, and only made public after
      the bug is fixed and a new version is released.

   Personally identifiable information
      Any piece of data that can be used to identify a single individual.
      Things like your name or where you live count as
      "personally identifiable information".

   Trust frame
      A distinct visual element that Kate uses to tell players when a
      potentially dangerous dialog comes from the Kate emulator itself,
      rather than a malicious cartridge trying to trick players.

      See the :doc:`trust and consent section <user/manual/security/trust>`
      for details.