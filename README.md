# Kate

> **NOTE:**  
> Kate is an experimental proof-of-concept currently, its security properties are not proven, and it may break randomly. Cartridge format is not final, you might need to re-package your game for newer versions.

Kate is a fantasy handheld console designed for simpler story-rich games, like Visual Novels and 2d RPGs. It looks like an old handheld, but runs on Windows, Mac, Linux, or in your browser.

It's built to be secure, respect your privacy, and give you agency on how you play your games. Developers can package their existing games for Kate and distribute it as a single cartridge file, playable on any platform the Kate emulator runs on. All sandboxed so players don't have to worry about malicious applications masquerading as games.

![](./docs/kate.png)

## Documentation

- [The Kate Concept Paper](./docs/concept.md) — wondering why Kate was made and what drives its design? Your answers are here.

- [The Kate User Manual](./docs/user-manual.md) — confused about how Kate works, or want something to link from your game page for common things like "how controls work" and "what's this icon on the screen?". This is where you go.

- [Making games for Kate!](./docs/dev-manual.md) — want to build a new game for Kate or port an existing web game to it? This guide will walk you through it. (work in progress)

- [Kate's Underlying Technology](./docs/technology.md) — curious about what's powering Kate, and what the system requirements are? This covers all that. (work in progress)

## Installation

Kate only supports installing from npm currently. You'll need [Node.js 16+](https://nodejs.org/en) installed. Run the following from the command line:

    $ npm install -g @qteatime/kate-desktop@experimental

You can then start it from the command-line as well:

    $ kate-desktop

Alternatively, you can use Kate online from https://kate.qteati.me/. It's possible to install the page as a web application and have it work offline:

- On Windows 10+: open the page in Microsoft Edge and choose `Apps -> Install site as an app` from the menu;
- On iPhone: open the page in Safari and choose `Share -> Add to Home Screen`;
- On Android: open the page in Google Chrome and choose `Install app` from the menu;

Note that the web option is practical, but not recommended for archival; you can't trust domains to always resolve to the same computer forever.

## Hacking on Kate

The core of Kate is written in [TypeScript](https://www.typescriptlang.org/), some tools are written in [Crochet](https://crochet.qteati.me/). To build Kate you'll need at least a working [Node.js](https://nodejs.org/en/) environment.

Setup things with:

```shell
$ npm install
$ node make all
```

After this you should have a working Kate. You can either use `node make desktop:run` to run it as an Electron app, or start a server on the `www` folder and point a modern browser there.

You should see a screen similar to the screenshot in this page, but without any cartridges. Drag the `hello.kart` file from the `examples/` folder and drop it over the console to install it. Then either click the game or use the keyboard/virtual buttons to play.

## Examples

See the `examples/` folder in this repository for some example games. You can build all of them into cartridges by running `node make example:all`.

- [**Hello, from Kate**](examples/hello-world/): A hello-world type demo that shows what keys you're pressing (uses the `input` API).

- [**Boon-scrolling**](examples/boon-scrolling/): A small "doom-scrolling" simulation with procedural generation (uses the `cart_fs`, `audio`, and `input` APIs, as well as the `domui` library for UI).

## Cartridges and runtime

Kate games are packaged as a single `.kart` binary file. This file contains something that can run in a webbrowser, a specification of which runtime it needs to use, some meta-data, and a set of files in a read-only file-system. In that sense, it's much like a `.zip` file, just without compression and with some additional meta-data for the console.

Currently the only supported runtime is `Web Archive`, which means you provide an HTML entry point and Kate will display that page in the console in a [fully sandboxed IFrame](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox) with JavaScript support.

This means no access to things like `fetch` or even loading images. In order to remediate that, Kate provides an IPC layer that allows this sandboxed process to do things—by posting messages to the parent window, and handling messages sent by the parent window.

Web APIs can be emulated through what Kate calls "bridges": small scripts injected into the page that replace common Web APIs with an implementation over Kate's IPC, so the game in question doesn't need to be Kate-aware.

By doing this, there's also no need for a web-server. Games can be played locally using all standard web technologies (and some enhanced Kate ones), and without worrying about network latency when loading resources. Players on the other hand enjoy the same benefits of regular executables without having to worry about sandboxing them themselves, or playing them in a different machine.

You build these `.kart` files using the included `kart` application, providing it with a JSON configuration file and an output location. For safety the cartridge can only include files that are contained in the directory of the JSON file.

See the `hello-world` example cartridge for some practical example of how this all works.

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
  - Reconfiguring keybindings;
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
