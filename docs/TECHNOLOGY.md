# Kate's Underlying Technology

Kate is a fantasy console that runs inside of a modern web browser, and as such makes use of modern web technologies to provide a safe, sandboxed, and entirely offline play experience.

## Supported platforms

Kate has been tested (and is known to work) on the following platforms:

- **Desktop**
  - Microsoft Edge 110 64-bit (Windows 11 22H2);
  - Google Chrome 110 64-bit (Windows 11 22H2, Ubuntu 20.04 64-bit);
  - Firefox 110 64-bit (Windows 11 22H2);
  - Opera 96 64-bit (Windows 11 22H2);
- **Mobile**
  - Microsoft Edge 110 64-bit (Windows 10 22H2, Surface Go);
  - Chrome for Android 108 (Android 9, Samsung J4+);

Kate is **known to not work** on the following platforms:

- **Desktop**
  - Internet Explorer (any version, any OS);
- **Mobile**
  - Safari for iOS (iOS 16.3, iPhone 11)

## System requirements

The Kate emulator itself has few requirements, however games will assume a fair bit of the hardware and are unlikely to work on older hardware.

### Hardware

- **Processor**: 1.4GHz quad-core (x86-64, amd64, ARM);
- **Memory:** 2GB;
- **Storage:** 32GB;
- **Graphics:** 300 MHz, OpenGL 3.0+

Devices with the lowest specification known to run Kate games include:

- [Raspberry Pi 4B](https://www.raspberrypi.com/products/raspberry-pi-4-model-b/specifications/);
- [Samsung J4+](https://www.samsung.com/se/smartphones/others/galaxy-j4-black-32gb-sm-j415fzkgnee/);
- [Surface Go](https://support.microsoft.com/en-us/surface/surface-go-1st-gen-specs-and-features-d5f9e6f4-1b01-f61a-6dac-ad4f963ddba5);
- Lenovo IdeaPad 310;

### Software

The browser running Kate must support the following features:

#### Required features

Kate cannot run at all if these are not available.

- **Internal / Core platform support**
  - CSS Level 4 — used for rendering Kate itself;
  - [WebAssembly](https://caniuse.com/wasm) — used for some game code (e.g.: Ren'Py) and additional codecs;
  - [DOM parsing and serialisation](https://caniuse.com/xml-serializer) — used for sandboxing cartridges' code and providing Kate's APIs;
  - [Cross-document messaging](https://caniuse.com/x-doc-messaging) — used for OS/game process communication;
  - [Web Workers](https://caniuse.com/webworkers) — used for background processes;
- **Graphics**
  - [Canvas API](https://caniuse.com/canvas) — used for graphics rendering;
    - [Text rendering](https://caniuse.com/canvas-text);
    - [WebGL 2.0](https://caniuse.com/webgl2);
  - [requestAnimationFrame](https://caniuse.com/requestanimationframe) — used for scheduling rendering calls in the OS;
  - [Web Animations API](https://caniuse.com/web-animation) — used for Kate and standard Kate game dev SDKs;
- **Security**
  - [Content Security Policy](https://caniuse.com/contentsecuritypolicy2) — used for restricting network usage;
  - [Permissions Policy](https://caniuse.com/permissions-policy) — used for sandboxing cartridges so they can't affect the player's device;
  - [Sandbox attribute for iframes](https://caniuse.com/iframe-sandbox) — same purpose as Permissions Policy;
  - [Shadow DOM](https://caniuse.com/shadowdomv1) — used for sandboxing extensions for security;
  - [Web Cryptography](https://caniuse.com/cryptography) — used for securing the communication protocol between Kate OS and game process;
- **Audio**
  - [WebAudio API](https://caniuse.com/audio-api) — used for playing audio;
- **Video**
  - [Video element](https://caniuse.com/video) — used for playing videos;
- **File / Data manipulation / Storage**
  - [Data URIs](https://caniuse.com/datauri) — used to load resources across OS/Game;
  - [Base64 encoding/decoding](https://caniuse.com/atob-btoa) — used for constructing Data URIs;
  - [Blob constructing](https://caniuse.com/blobbuilder) and [referencing](https://caniuse.com/bloburls) — used for loading files in games;
  - [File access](https://caniuse.com/fileapi) and [reading](https://caniuse.com/filereader) — loading data from device's files into Kate's internal storage;
  - [IndexedDB](https://caniuse.com/indexeddb2) — used for storing cartridge and OS data;
  - [TextEncoder/Decoder](https://caniuse.com/textencoder) — used for reading text files in unicode;
  - [URL API](https://caniuse.com/url) — used internally;
- **Network / Internet access**
  - [Fecth](https://caniuse.com/fetch) — used for network requests on the OS side;

#### Optional features

Kate provides fallbacks for some of these. The experience of playing the game may be affected, and some games may rely on these being available.

- [Gamepad API](https://caniuse.com/gamepad) — used to support gamepads as an additional input;
- [Drag and Drop](https://caniuse.com/dragndrop) — used for installing cartridges by dropping them on the console (mobile devices have a button for this instead);
- [Offline web applications](https://caniuse.com/offline-apps) — used to allow https://kate.qteati.me to run without internet connection;
- [Add to home screen](https://caniuse.com/web-app-manifest) — used to allow installing https://kate.qteati.me as a native-like app;
- [Media Capture from DOM](https://caniuse.com/mediacapture-fromelement) — used for screenshots and gameplay recording;
- [Full Screen API](https://caniuse.com/fullscreen) — used for running the console in fullscreen;
- [Service Workers](https://caniuse.com/serviceworkers) — used for running Kate offline;

#### Planned future features

Features added in the future might use the APIs below:

- [Media Capture API](https://caniuse.com/html-media-capture) — Using microphone or camera as input, but much work needs to be done in making the privacy implications of this understandable and reasonable for players;
- [Media Recorder API](https://caniuse.com/mediarecorder) — ?;
- [Custom protocol handling](https://caniuse.com/registerprotocolhandler) — better supporting users to share content from games as URLs that can open directly in their respective games;
- [Video tracks](https://caniuse.com/videotracks) and [audio tracks](https://caniuse.com/audiotracks) — providing accessibility features (subtitles, sign-language, etc) on videos, support is currently very spotty however;
- [Streams](https://caniuse.com/streams) — for improving memory usage in Kate (currently the entire cartridge is loaded in memory, requiring at least double the amount of RAM);

### Data format support

- **Video**: [AV1](https://caniuse.com/av1), [WebM](https://caniuse.com/webm). [Ogg/Theora](https://caniuse.com/ogv)
- **Audio**: [Ogg Vorbis](https://caniuse.com/ogg-vorbis), [Wav](https://caniuse.com/wav), [MP3](https://caniuse.com/mp3), [Opus](https://caniuse.com/opus)
- **Font**: [WOFF 2](https://caniuse.com/woff2), [WOFF](https://caniuse.com/woff), TTF
- **Image**: [PNG](https://caniuse.com/png-alpha), [WebP](https://caniuse.com/webp), [APNG](https://caniuse.com/apng)

### Known browsers meeting requirements

- Microsoft Edge 110 (Windows 64-bit);
- Chrome 110 (Windows 64-bit, Linux 64-bit);
- Chrome for Android 108 (Android 64-bit);
- Firefox 110 (Windows 64-bit);
- Opera 96 (Windows 64-bit);
