# Kate

> **NOTE:**  
> Kate is an experimental proof-of-concept currently, its security properties are not proven, and it may break randomly. Cartridge format is not final, you might need to re-package your game for newer versions.

Kate is a fantasy handheld console designed for simpler story-rich games, like Visual Novels and 2d RPGs. It looks like an old handheld, but runs on Windows, Mac, Linux, or in your browser.

It's built to be secure, respect your privacy, and give you agency on how you play your games. Developers can package their existing games for Kate and distribute it as a single cartridge file, playable on any platform the Kate emulator runs on. All sandboxed so players don't have to worry about malicious applications masquerading as games.

![](./docs/kate.png)

## Documentation

- [The Kate Concept Paper](./docs/concept.md) — wondering why Kate was made and what drives its design? Your answers are here.

- [The Kate User Manual](./docs/user-manual.md) — confused about how Kate works, or want something to link from your game page for common things like "how controls work" and "what's this icon on the screen?". This is where you go. (work in progress)

- [The Kate Threat Model](./docs/threat-model.md) — wondering how Kate protects your safety and privacy? This document goes into details of what you're signing up for, using real-world examples. (work in progress, technical)

- [Making games for Kate!](./docs/dev-manual.md) — want to build a new game for Kate or port an existing web game to it? This guide will walk you through it. (work in progress, technical)

- [Kate's Underlying Technology](./docs/technology.md) — curious about what's powering Kate, and what the system requirements are? This covers all that. (work in progress)

- [Known issues & limitations](./docs/known-issues.md) — Kate is still in preview/early-access. Known issues are documented here.

## Installation

The current recommended way of trying out Kate is to use the Web version: https://kate.qteati.me/

For alternative installation options and how to build Kate from source, please refer to the [Kate installation instructions](./docs/installation.md).

## Examples

See the `examples/` folder in this repository for some example games. You can build all of them into cartridges by running `node make example:all`.

- [**Hello, from Kate**](examples/hello-world/): A hello-world type demo that shows what keys you're pressing (uses the input API).

- [**Boon-scrolling**](examples/boon-scrolling/): A small "doom-scrolling" simulation with procedural generation (uses the cartridge, audio, and input APIs, as well as the `domui` library for UI).

- [**Kat'chu**](examples/katchu/): An older-style handheld arcade where you shoot for the highest score in 30 seconds (uses the timer, cartridge, audio, input, capture, and storage APIs).

## Contributing to Kate

Kate does not accept source contributions currently, since it has not reached a stable release yet. However here are some other ways you can contribute to Kate's development:

- [Try Kate out](./docs/installation.md);
- [Try porting your game to Kate](./docs/dev-manual.md);
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
- ~~Visualising and managing device storage;~~
- **Digital OSTs and artbooks as cartridges;** _(<- we're here now)_
- Decentralised stores (a community-driven form of curation);
- Arbitrary text input;
- Game collections and library filtering;
- Exporting and synchronising data across devices;
- Auditing action logs in the console;
- Native app support (Android, ChromeOS, SteamOS, Linux, Windows);
- Accessibility options (TTS, contrast, sizes, etc);
- Stabilise cartridge format;
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
- ➖ RPG Maker MV (requires minor code changes in the game);
- ➖ Unity (requires minor code changes in the game);
- ✖️ Twine (requires changes to Kate's sandboxing);
- ✖️ Godot (requires changes to Kate's sandboxing);
- ✖️ Construct 3 (requires changes to Kate's sandboxing);
- ✖️ TyranoBuilder (requires changes to Kate's sandboxing);

<br>

**Legend**

- ✔️ full support with bridges
- ➖ partial support/requires code changes
- ✖️ requires changes to Kate itself

## Licence

Copyright (c) 2023 Q.  
Licensed under the permissive MIT licence.
