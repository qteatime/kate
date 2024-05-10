# The Kate Project

> **NOTE:**  
> The Kate project is an experimental proof-of-concept currently, its security properties are not proven, and it may break randomly. Cartridge format is not final, you might need to re-package your game for newer versions.

A small fantasy console for small 2d games, particularly story-rich ones, like visual novels and RPGs. It looks like a handheld from the 2000s, but runs right in your browser (or natively on a Raspberry Pi).

![](./docs/kate.png)

We built it to be secure, respect your privacy, and give you agency on how you play your games. It has a [modern take on application security][sandboxing] which keeps your device and data safe even if you happen to run a buggy or malicious cartridge!

What's more? The console specifications are based on real, reasonably-priced, off-the-shelf hardware so if you like tinkering with crafts and electronics you can actually [put together your very own physical console][diy]. The "Build Your Own Console" guide is still a work in progress, though. You can expect more news on this, along with open-source models for 3d printing, in the later part of 2024.

[sandboxing]: https://docs.kate.qteati.me/user/manual/security/sandboxing.html
[diy]: https://docs.kate.qteati.me/user/diy/index.html

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

- [**Kate Publisher**](ecosystem/publisher/): A tool that allows creating
  and signing cartridges for Kate from your game or app's code and data.

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

See the [complete, detailed roadmap here](ROADMAP.md).

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
- Exporting and synchronising data across devices;
- Decentralised stores (a community-driven form of curation);
- Game collections and library filtering;
- Native Kate support (on the Raspberry Pi);
- Accessibility options (TTS, contrast, sizes, etc);
- Stabilise cartridge format;
- Digital OSTs and artbooks as cartridges;
- Formal semantics and security proofs;

### Planned features (post stable release)

- **APIs**
  - Gyroscope input support;
  - Kate's own virtual keyboard (for devices like the Raspberry Pi);
  - Multi-touch and stylus input support;
  - Multiple gamepad support;
  - Haptic feedback (device and gamepad vibration);
  - Badges/Achievements API;
  - Networking API (HTTP and P2P for online multi-player games);
  - Audio support in video recording;
- **OS**
  - Custom theming support;
  - Tag-based file system;
  - Multi-process support;
  - Typed and capability-secure inter-process communication;
  - DLC/Patch/Extension cartridge support;
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

The Kate operating system and other core parts of the Kate project that
impact the security and privacy guarantees we can provide to users are
licensed under the [GNU General Public License v2.0][gpl-2] (or later).
Other applications that are part of the Kate project are released under
the [Mozilla Public Licence v2.0][mpl-2] or more permissive licenses.

The [Licence FAQ](./LICENCE-FAQ.md) provides answers to common questions
you might have (including "why so many licences?"), but the short version is:

- `packages/kate-core` (the operating system),
  `packages/kate-desktop` (the native application),
  `packages/kate-tools` (the command line tools),
  `packages/glomp` (the build system for Kate code),
  `packages/db-schema` (the database layer for Kate),
  `ecosystem/importer` (the Kate importer),
  `ecosystem/publisher` (the Kate publisher),
  `support/*` and `make.js` (the Kate build system)
  are all released under the GPL v2. Modifying or linking to
  them requires your work to also be released under the GPL.

- `packages/kate-api` (the Kate Runtime API) and `packages/kate-bridges`
  (the bridge extensions of the Kate Runtime API) are also released under
  GPL v2, but with an exception clause such that Kate cartridges using them
  don't become covered by the GPL --- in essence, Kate cartridges can be
  proprietary or have any other licence you choose, no need to release
  the source code (the Kate operating system packages above already provide
  all necessary security and privacy guarantees to Kate users).

- `packages/kate-appui` (the App UI library),
  `packages/kate-domui` (the DOM UI library),
  `packages/ljt-vm` (the implementation of the LJT serialisation format),
  `packages/schema` (the LJT schemas for Kate cartridges), and
  `packages/util` (misc. utilities used by all Kate components)
  are all released under the MPL v2. You have to release the source code
  of any modification you make to files in those packages, but you can
  combine them with proprietary code just fine (the MPL will not apply
  to the portion in another licence if it's in a separate file).

- `test/*` is always released to the public domain (CC0).

- `examples/*` have their code under public domain (CC0) or the MIT licence.
  Images and other resources are generally under CC4-BY. You'll need to check
  each example separately, but you can always use the code from them without
  attribution (although not things like images and story).

[gpl-2]: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
[mpl-2]: https://www.mozilla.org/en-US/MPL/
[spdx]: https://spdx.dev/learn/handling-license-info/
