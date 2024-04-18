Why make games for Kate?
========================

Kate is a :term:`fantasy console`. This essentially means that while the
hardware specifications are real, there is no off-the-shelf device that
users can buy from a store (although they could build one themselves).
Rather, users will mostly be running an emulator of the real Kate device
on their computer or phone/smartdevice. Think of how people can run
games made for 90s and 00s era consoles in their desktop nowadays;
Kate is similar.

Unlike most commercial consoles, however, Kate is first and foremost
a platform *for players*. This means that we want to respect their
safety, privacy, and agency as much as possible. We want players to
be able to download any random game they find on the internet and
run it, without having to think about whether that game will try
to do weird things to their computer or data.

As a developer, by making a game for Kate you get to:

* Program for a single platform, distribute your game as a single file,
  and have players install and run it offline in any device the Kate
  emulator runs on, with a predictable experience.

* Avoid scary security warnings when the player launches your game
  on Windows or MacOS
  (Kate prevents malicious applications from damaging the player's
  device and data :doc:`in a different way </user/manual/security/sandboxing>`).

* Have the option of packaging the emulator and your game as a webpage,
  which you can then upload to platforms like Itch.io as a web game.

* Use the same tools you're already familiar with, as long as they at
  least offer an option to make a web export [#f1]_; and

* Avoid having to optimise your asset sizes for streaming on the web,
  like you would with a regular web-based game. This means you can
  have games with gigabytes in size that still start up instantly,
  there's no download happening while the player is running the game.

On top of the APIs that are provided in the web platform Kate adds its
own game-specific APIs that have a baseline expectation among players.
This means that you don't need to keep re-explaining yourself.

These APIs include things like safe and reliable persistent storage
for your save data, support for screenshot and video capture of gameplay,
simplified and consistent input handling regardless of whether players
are using a keyboard, a touch-screen, a gamepad, etc.

.. [#f1] Kate is not a web browser; it does not run web games directly.
   This means that even if your game runs in a web browser, it's not
   a guarantee that it will run on Kate—cartridges don't have internet
   access for one.

   Kate can inject emulated web APIs (called Bridges) to make porting
   web games to Kate easier, but support for various engines is still
   a work in progress.
