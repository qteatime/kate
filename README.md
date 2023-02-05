# Kate

> **NOTE:** Kate is an experimental proof-of-concept currently, expect it to randomly break on every new release (or, like, just on a regular usage). Cartridge format is not final and old binaries will not work on version changes.

Kate is a fantasy handheld console designed for simpler story-rich games, like Visual Novels and 2d RPGs. It looks like an old handheld, but runs on Windows, Mac, Linux, or in your browser. That way, you can easily and **safely** share small games as a single file that can run anywhere; and players can install and play it without worrying too much about security, since it's all sandboxed!

You can try Kate directly from your web-browser: go to https://kate.qteati.me/ and install the `hello.kart` file provided in this repository by drag-dropping it over the console.


![](./docs/kate.png)


## Specifications

  | | |
  | - | - |
  | **Display** | 800x480 (normal-mode) or 320x192 (mini-mode) — a 5:3 screen |
  | **Cartridge size limit** | 512mb |
  | **Input** | D-pad, O, X, L, R, Menu, and Capture (6 buttons), multi-touch |


## Default input configuration

  | **Kate** | **Common uses** | **Keyboard** |
  | -------- | --------------- | ------------ |
  | D-pad | Navigation, directional input | arrow keys |
  | O    | Confirm selection, Ok | Z |
  | X    | Cancel selection, alternate input | X |
  | L    | Previous page | A |
  | R    | Next page | S |
  | Menu | Contextual menu, long-press for OS menu | left Shift |
  | Capture | Take a screenshot, long-press for recording video | left Ctrl |


## Hacking on Kate

The core of Kate is written in [TypeScript](https://www.typescriptlang.org/), some tools are written in [Crochet](https://crochet.qteati.me/). To build Kate you'll need at least a working [Node.js](https://nodejs.org/en/) environment.

Setup things with:

```shell
$ npm install
$ node make build
```

After this you should have a working Kate. You can either use `npm run app` to run it as an Electron app, or start a server on the `www` folder and point your favourite webkit* browser there.

You should see a screen similar to the screenshot above, but without any cartridges. Drag the `hello.kart` file from the `examples/` folder and drop it over the console to install it. Then either click the game or use the keyboard/virtual buttons to play.

> It's a goal for it to work on non-webkit-based browsers, but I have not tested it there yet.


## Cartridges and runtime

Kate games are packaged as a single `.kart` binary file. This file contains something that can run in a webbrowser, a specification of which runtime it needs to use, some meta-data, and a set of arbitrary files in a read-only file-system. In that sense, it's much like a `.tar` or `.zip` file, just without compression and with some additional meta-data for the console.

Currently the only supported runtime is `Web Archive`, which means you provide an HTML entry point and Kate will display that page in the console in a [fully sandboxed IFrame](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox) and JavaScript support.

This means no access to things like `fetch` or even loading images. In order to remediate that, Kate provides an IPC layer that allows this sandboxed process to do things—by posting messages to the parent window, and handling messages sent by the parent window.

Web APIs can be emulated through what Kate calls "bridges": small scripts injected into the page that replace common Web APIs with an implementation over Kate's IPC, so the game in question doesn't need to be Kate-aware.

By doing this, there's also no need for a web-server. Games can be played locally using all standard web technologies (and some enhanced Kate ones), and without worrying about network latency when loading resources. Players on the other hand enjoy the same benefits of regular executables without having to worry about sandboxing them themselves, or playing them in a different machine.

You build these `.kart` files using the included `kate-packaging` (`kart`) application, providing it with a JSON configuration file and an output location. For safety the cartridge can only include files that are contained in the directory of the JSON file.

See the `hello-world` example cartridge for some practical example of how this all works.


## Licence

Copyright (c) 2021 Q.
Licensed under the permissive MIT licence.
