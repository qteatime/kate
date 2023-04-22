# Kate

> **NOTE:**  
> Kate is an experimental proof-of-concept currently, its security properties are not proven, and it may break randomly. Cartridge format is not final, you might need to re-package your game for newer versions.

Kate is a fantasy handheld console designed for simpler story-rich games, like Visual Novels and 2d RPGs. It looks like an old handheld, but runs on Windows, Mac, Linux, or in your browser.

It's built to be secure, respect your privacy, and give you agency on how you play your games. Developers can package their existing games for Kate and distribute it as a single cartridge file, playable on any platform the Kate emulator runs on. All sandboxed so players don't have to worry about malicious applications masquerading as games.

![](./docs/kate.png)

## Documentation

- [The Kate Concept Paper](./docs/concept.md) — wondering why Kate was made and what drives its design? Your answers are here.

- [The Kate User Manual](./docs/user-manual.md) — confused about how Kate works, or want something to link from your game page for common things like "how controls work" and "what's this icon on the screen?". This is where you go.

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

## Roadmap

For the current work, see [the Kate Preview meta-issue](https://github.com/qteatime/kate/issues/1).

Planned features:

- **Game APIs**:
  - Multi-touch input;
  - Keyboard and virtual keyboard input for arbitrary text;
  - Gyroscope input support;
  - Haptic feedback/vibration (console and gamepad);
  - ~~Object store API (flat, tag-based);~~
  - Object database API (IndexedDB-like);
  - Improved audio API (graph-based);
  - Improved screen recording API (audio support);
  - Networking API (http, p2p);
  - Badges/achievements API;
- **KateOS improvements**
  - ~~Reconfiguring keybindings;~~
  - ~~Tracking play times locally;~~
  - Game collections and filtering;
  - Support for game booklets and OSTs;
  - "Store" for finding games in connected distributed repositories;
  - "Audit" for auditing security logs/actions in the console;
  - Visualising and managing storage usage per cartridge;
  - Notification preferences;
  - Custom emulator themes;
  - Exporting/synchronising save data across devices;
- **Supporting games not designed for Kate**:
  - Proxying HTML Audio/Web Audio APIs;
  - Proxying IndexedDB API;
  - Full support for common game engines through bridges;
- **Supporting tooling**:
  - Kate Studio, a fully integrated game maker for Kate games;
  - Kate SDK, a lower-level set of tools/libraries for building games;

## Licence

Copyright (c) 2023 Q.  
Licensed under the permissive MIT licence.
