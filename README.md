# Kate

> **NOTE:**  
> Kate is an experimental proof-of-concept currently, its security properties are not proven, and it may break randomly. Cartridge format is not final, you might need to re-package your game for newer versions.

Kate is a fantasy handheld console designed for simpler story-rich games, like Visual Novels and 2d RPGs. It looks like an old handheld, but runs on Windows, Mac, Linux, or in your browser.

It's built to be secure, respect your privacy, and give you agency on how you play your games. Developers can package their existing games for Kate and distribute it as a single cartridge file, playable on any platform the Kate emulator runs on. All sandboxed so players don't have to worry about malicious applications masquerading as games.

![](./docs/kate.png)

## Documentation

A pre-built version of the documentation can be found on:
https://docs.kate.qteati.me/

To build the documentation from this repository yourself you'll need to have [Python](https://www.python.org/), [Sphinx](https://www.sphinx-doc.org/en/master/), and the [Furo sphinx theme](https://github.com/pradyunsg/furo). Once you have Python you can install the other two with:

```shell
$ pip install sphinx furo
```

Once you've done that you can build the documentation running the following
at the root of this repository:

```shell
$ node make docs:build
```

The documentation is generated in `docs/build/html`.

## Installation

The current recommended way of trying out Kate is to use the Web version: https://kate.qteati.me/

For alternative installation options and how to build Kate from source, please refer to the [Kate installation instructions](https://docs.kate.qteati.me/user/manual/intro/install.html).

## Ecosystem

Kate provides tools for making or porting games to the console. Together these
tools constitute the "Kate Ecosystem", and are generally available under the
`ecosystem/` folder in this repository. You can build all of them into
cartridges by running `node make ecosystem:all`.

- [**Kate Importer**](ecosystem/importer/): A tool that allows installing and
  running games made for other platforms in Kate, using emulation.

- [**Kate Command-line Tools**](packages/kate-tools/): A set of command-line
  tools for making and publishing Kate cartridges.

## Examples

See the `examples/` folder in this repository for some example games. You can build all of them into cartridges by running `node make example:all`. Example
cartridges have their own licences (usually more permissive than Kate's).

- [**Hello, from Kate**](examples/hello-world/): A hello-world type demo that shows what keys you're pressing (uses the input API).

- [**Boon-scrolling**](examples/boon-scrolling/): A small "doom-scrolling" simulation with procedural generation (uses the cartridge, audio, and input APIs, as well as the `domui` library for UI).

- [**Kat'chu**](examples/katchu/): An older-style handheld arcade where you shoot for the highest score in 30 seconds (uses the timer, cartridge, audio, input, capture, and storage APIs).

- [**A certain autumn evening**](examples/a-certain-autumn-evening/): A
  micro visual novel (~900 words) that show cases how Ren'Py games can be
  published as Kate cartridges.

## Contributing to Kate

Kate does not accept source contributions currently, since it has not reached a stable release yet. However here are some other ways you can contribute to Kate's development:

- [Try Kate out](https://docs.kate.qteati.me/user/manual/intro/install.html);
- [Try porting your game to Kate](https://docs.kate.qteati.me/dev/manual/index.html);
- Tell other people about Kate;
- Report things that don't work for you, or that you feel are too cumbersome or unsafe;

## Roadmap (to Kate stable release)

- ~~Running local sandboxed cartridges;~~
- ~~Keyboard input support;~~
- ~~Gamepad input support;~~ _(0.23.4)_
- ~~Screenshot and video capture support;~~
- ~~Save data support;~~ _(0.23.5)_
- ~~Pointer input support;~~
- ~~Higher resolution with external displays;~~
- ~~Visualising and managing device storage;~~ _(0.23.6)_
- ~~Arbitrary text input;~~
- ~~Auditing action logs in the console;~~ _(0.23.8)_
- **Exporting and synchronising data across devices;** _(<- we're here now)_
- Decentralised stores (a community-driven form of curation);
- Game collections and library filtering;
- Native app support (Android, ChromeOS, SteamOS, Linux, Windows);
- Accessibility options (TTS, contrast, sizes, etc);
- Stabilise cartridge format;
- Digital OSTs and artbooks as cartridges;
- Formal semantics and security proofs;

### Planned features (post stable release)

- **APIs**
  - Gyroscope input support;
  - Kate's own virtual keyboard (for devices like the Raspberry Pi);
  - Multi-touch and stylus input support;
  - Haptic feedback (device and gamepad vibration);
  - Badges/Achievements API;
  - Networking API (HTTP and P2P for online multi-player games);
  - Audio support in video recording;
- **OS**
  - Custom theming support;
  - OS mods (for cases where changing OS behaviour is desired);
- **Tooling**
  - Kate SDK (low-level API for making Kate games);
  - Kate Studio (game-maker-style app for making 2d VNs/Adventures/RPGs);
  - Kart as a cartridge (to improve security);
  - Kate-dist as a cartridge (to improve security);
  - Native app support for MacOS;

### Game engine support

We aim to support all reasonable web-exports of common game engines. The list below is the ones that are being tested and actively worked on (as the games people make with them fit Kate's general goals).

- ✔️ **Bitsy** (full support as of Kate v0.23.5);
- ✔️ **Ren'Py** (full support for Ren'Py web export 7.5 and 8.1 as of Kate v0.23.6);
- ✔️ **GB Studio** (web emulators work with existing bridges, but no recipe provided yet);
- ✔️ **Pico-8** (web export works with existing bridges, but no recipe provided yet);
- ✔️ **Godot 3** (web exports should be functional as of Kate v0.25.x);
- ✔️ **RPG Maker MV** (web exports should be functional as of Kate v0.25.x --- plugin support depends on what APIs the plugin requires);
- ✔️ **GameMaker** (web exports should be functional as of Kate v0.25.x);
- ➖ Unity (requires minor code changes in the game);
- ✖️ Twine (requires changes to Kate's sandboxing);
- ✖️ Godot 4 (requires changes to Kate's sandboxing);
- ✖️ Construct 3 (requires changes to Kate's sandboxing);
- ✖️ TyranoBuilder (requires changes to Kate's sandboxing);

<br>

**Legend**

- ✔️ full support with bridges
- ➖ partial support/requires code changes
- ✖️ requires changes to Kate itself

## Licence

Unless otherwise specified, Kate, its constituing packages, tools, and
ecosystem cartridges are all released under the
[Mozilla Public License v2.0][mpl]. The following header should be present in
the relevant files:

```
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
```

Where dependencies are used, they remain under their specific licences.
If a package includes more specific licence, it'll have its own `LICENCE.txt`
file. Otherwise `LICENCE.txt` at the root of this repository applies.
See those files for all details and legally-binding texts, this section is
merely informational.

Kate is [free software][free] under a [copyleft][] licence. You'll
always be able to obtain the source code for it, and you'll always be able to
audit what you're running. If you modify Kate _and distribute
your modified version to others_, you'll need to make available the
source code for those modifications and the build instructions as well.
The recipients of your modified copy should continue to have the same rights.

Note that the MPL does not grant you trademark, logo, and similar rights. It
also does not require you to release source code for things you make with
MPL-licenced code---only changes to specifically MPL-licenced code. See
[Mozilla's FAQ on MPL][faq].

[mpl]: https://www.mozilla.org/en-US/MPL/
[free]: https://en.wikipedia.org/wiki/Free_software
[cc4]: https://creativecommons.org/licenses/by/4.0/
[copyleft]: https://en.wikipedia.org/wiki/Copyleft
[faq]: https://www.mozilla.org/en-US/MPL/2.0/FAQ/
