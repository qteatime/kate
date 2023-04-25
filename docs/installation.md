# Kate installation instructions

> **NOTE**: This is a living document. Information here applies to Kate v0.23.5

Kate is a fantasy hand-held console, the primary form of distribution is as an emulator. You can install the emulator program in any of your devices and run any Kate cartridge in it. The big advantage of Kate over native executables is that all cartridges run in a sandbox, and thus can't damage your device, even if they turn out to be malicious.

The easiest way of trying out Kate is to use the online emulator. Just open https://kate.qteati.me in a modern browser in your device and install some cartridges in it. Kate is tested on and supports the latest versions of Chrome (desktop and Android), Edge, Opera, Firefox, and Safari. If you're using iOS, Safari is the recommended browser, as other browsers have restricted capabilities there.

If you would like to use Kate for more than just trying a couple of games, there are a few different options offered, each comes with different trade-offs in terms of security and effort.

From most recommended to least recommended:

- [Web version](#web-version) (available on Windows, Linux, iOS, Android);
- [Pre-built binaries](#pre-built-binaries) (available on Linux and Windows);
- [Building from source](#building-from-source) (available on Linux and Windows);

> **NOTE:**<br>
> The web version should be compatible with MacOS, ChromeOS, and other platforms with a modern browser. However those devices are not currently part of the testing pipeline. Once they are they will be added to the list, too.

## Web version

You can install the web version of the emulator (https://kate.qteati.me) in your device, as a web app. This is the only option available on mobile phones currently, but it is close enough to a native app: you'll have an icon in your home screen, and it will work off-line.

To install:

- On **Windows 10+**: open the page in Microsoft Edge and choose `Apps -> Install site as an app` from the menu;
- On **iPhone**: open the page in Safari and choose `Share -> Add to Home Screen`;
- On **Android**: open the page in Google Chrome and choose `Install app` from the menu;

### Caveats

The web option is practical, and fine if you don't see yourself using the emulator for longer than a couple of years, but is not recommended for archival. Its security properties depend on the domain it uses (`kate.qteati.me`) taking you to the same computer for ever. Since the authors of Kate are neither immortal nor immune to financial problems, it's not clear that the domain would still belong to them and resolve to the same computer in 5 years or longer.

A domain takeover, where someone else buys the domain and routes it to a different computer, would allow the attacker to have access to all information locally stored in Kate in your device, and any additional permissions you've granted the domain (which is a significant risk).

## Pre-built binaries

[Pre-built versions of Kate are released on GitHub](https://github.com/qteatime/kate/releases). You need to download the right compressed archive for your OS and extract it somehwere in your computer, then run Kate from the provided executable.

> **NOTE**<br>
> On Windows you can check your OS architecture by going to `Settings -> System -> About` and checking your `System type` in the device specifications. On Linux you can run `uname -m` in the terminal. Note that `x86_64` and `x64` are the same thing.
>
> Alternatively, you can open https://kate.qteati.me/ on a Chromium-based browser (Chrome, Opera, Edge, Brave, etc) and go to `Applications -> About Kate`. Your processor architecture should show under `Host -> Architecture`.

On Windows 10 or more recent (Windows 8 and earlier are not supported, but you can [try building from source](#building-from-source)):

- Download one of the following:
  - Intel/AMD 64-bit processors (e.g.: Intel i7): `kate-win32-x64.zip`;
  - Intel/AMD 32-bit processors: `kate-win32-ia32.zip`;
  - ARM 64-bit processors (e.g.: Microsoft SQ1): `kate-win32-arm64.zip`;
- Extract the zip somewhere in your computer;
  - You can right-click the folder and choose `Extract all...`;
- Run `Kate.exe`.

On Linux:

- Download one of the following:
  - Intel/AMD 64-bit processors (e.g.: Intel i7): `kate-linux-x64.tar.gz`;
  - ARMv7 32-bit processors (e.g.: Raspberry Pi): `kate-linux-armv7l.tar.gz`;
  - ARM 64-bit processors: `kate-linux-arm64.tar.gz`;
- Extract the file somewhere in your computer;
  - You can run something like `tar -xzf kate-linux-x64.tar.gz` in the terminal;
- Run `kate`

### Caveats

The pre-built binaries are not [code-signed](https://en.wikipedia.org/wiki/Code_signing), this means that the OS cannot verify where it came from, and modern Windows versions will warn you about this. The releases are generated with `node make release:win:all` and `node make release:linux:all`, you can always [build it from source](#building-from-source) yourself.

Pre-built binaries do not themselves run in a sandbox—that is, they are run with all the same permissions your user has. As a Chromium-based application, both the Kate kernel and the cartridge processes are sandboxed with the [Chromium sandbox](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/design/sandbox.md). However, note that this only limits the potential damage caused by running arbitrary cartridges, you still need to place your full trust in the Kate emulator, as it will have very wide permissions.

## Building from source

Building Kate from source allows you to audit the code and have more assurance of where all components came from. You'll need [Node.js 18+](https://nodejs.org/en) installed.

> **NOTE:**<br>
> This is your only option if you want to run Kate on Windows 8 and earlier, as [Google has stopped supporting them in Chromium](https://support.google.com/chrome/thread/185534985/sunsetting-support-for-windows-7-8-8-1-and-windows-server-2012-and-2012-r2-in-early-2023). The last Chromium version with support for Windows 7 and 8 is Chromium 109, and the last Electron version with this support is 22.
>
> You can try making a manual package with an older Electron version, but you'll be on your own, and you might need to make changes to Kate's source code (the Electron part) to get it to work with older APIs.

### Automatic bootstrapping (will download artifacts)

There's an included bootstrap script in the repository that can set things up for you, in a common OS installation. However, it will download artifacts from the internet and invoke an external Zip application ([Extract-Archive](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.archive/expand-archive?view=powershell-7.3) on Windows, and `unzip` in MacOS/Linux) to unzip the Electron release. You can do all these steps with:

```shell
$ node support/bootstrap.js --npm-install --download-electron --unzip-electron --build
```

### Manual bootstrapping

If you'd rather have a manual setup, you'll need the `glob` and `typescript` packages, and you'll need Electron 24.1.2. You can download the right `electron-*.zip` for your OS/architecture from the [Electron releases page](https://github.com/electron/electron/releases/tag/v24.1.2), then extract to the `electron/` directory.

Note that some sub-packages also have dependencies that need to be installed. See `node make dependencies` for what to do if you want to avoid network requests.

After setting up, `node make all` will build all sub-packages.

```shell
$ node make all
```

### Checking that bootstrap was successful

After this you should have a working Kate. You can either use `node make desktop:run` to run it as an Electron app, or start a server on the `www` folder and point a modern browser there.

You should see a screen similar to the screenshot in this page, but without any cartridges. Drag the `hello.kart` file from the `examples/` folder and drop it over the console to install it. Then either click the game or use the keyboard/virtual buttons to play.

### Generating a release from source

Under Windows, you can run the following to generate a Kate release:

```shell
$ node make release:win64
```

Under Linux, you can run the following to generate a Kate release:

```shell
$ node make release:linux64
```

Both of these will download Electron from [the Electron releases page on GitHub](https://github.com/electron/electron/releases). If you'd rather do that manually, either download the zip file or compile Electron from source yourself, then place the zip in the `.cache` folder.

### Caveats

The same caveats as with [the pre-built binaries](#pre-built-binaries) applies. Electron in itself is unsandboxed, only the Kate kernel and cartridge processes run inside of a sandbox.