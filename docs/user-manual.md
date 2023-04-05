# The Kate Manual

> **NOTE**: This is a living document. Information here applies to Kate v0.23.4

Kate is a fantasy hand-held console for small 2d applications, particularly RPGs, Visual Novels, and similar story-driven games. As a fantasy console, games are generally run in an emulator program—the current emulator can run as a native application in Windows, Linux, and MacOS, as well as in a modern web browser (supporting Android, iOS, and other devices).

Kate is an accessibility, security, and privacy conscious platform. We want players to be in control of their gaming experience, and we want to make sure they have a fun (and safe!) time playing regardless of what cartridge they choose to run.

This manual describes the underlying technology Kate uses, so you have a better idea of how it achieves these safety and privacy goals. As well as what features it provides.

For information on how to make games for Kate, see [Making games for Kate!](./dev-manual.md).

## Hardware specification

|                      |                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **Console case**     | 16cm width x 7cm height x 3cm depth<br><small>(1310px x 570px in the emulator)</small>        |
| **Display**          | capacitive touch screen, 4" (86x51 mm)<br><small>(a 5:3 screen at 800x480 resolution)</small> |
| **CPU**              | 1GHz\*                                                                                        |
| **RAM**              | 512 MB\*                                                                                      |
| **Internal storage** | 128 GB\* (8 GB reserved for OS)                                                               |
| **Cartridge limit**  | 512 MB                                                                                        |
| **Digital input**    | D-pad, 6-buttons (O, X, L, R, Menu, Capture)                                                  |
| **Sensors**          | Accelerometer\*\*, Gyroscope\*\*                                                              |
| **Sound**            | Stereo speakers, 3.5mm headphone jack, bluetooth\*\*                                          |
| **Programming**      | Web technologies (JavaScript, HTML, CSS, WebAssembly)                                         |

**Note**:

\*Hardware speed is not limited in the emulator, but the emulator ticks at 30 FPS

\*\*For emulator users, the real device must provide these pieces of hardware.

## Controls

| Button                    | Name    | Keyboard   | [Standard gamepad][std-gamepad]                                             |
| ------------------------- | ------- | ---------- | --------------------------------------------------------------------------- |
| ![](./img/dpad_24.png)    | D-Pad   | Arrow keys | Left D-pad (12 to 15)<br>Left thumbstick (axes 0 and 1)                     |
| ![](./img/ok_24.png)      | Ok      | Z          | Rightmost right button (1)<br><small>(e.g.: A on SNES, B on XBox)</small>   |
| ![](./img/cancel_24.png)  | Cancel  | X          | Bottom-most right button (0)<br><small>(e.g.: B on SNES, A on XBox)</small> |
| ![](./img/l_24.png)       | L       | A          | Left bumper (frontmost) (4)                                                 |
| ![](./img/r_24.png)       | R       | S          | Right bumper (frontmost) (5)                                                |
| ![](./img/menu_24.png)    | Menu    | Left Shift | Left special button (8)<br><small>(e.g.: Select on SNES, View on XBox)      |
| ![](./img/capture_24.png) | Capture | Left Ctrl  | Right special button (9)<br><small>(e.g.: Start on SNES, Menu on XBox)      |

Kate also supports controlling the emulator by touching/clicking the virtual buttons in the emulator application. For the bumpers, it's enough to touch anywhere near the top left/right corners of the emulator; you should see the button highlighted or moving on the screen when you do.

You can also use off-the-shelf gamepads with Kate. The button layout matches the one described in the [Gamepad][std-gamepad] specification. Numbers here refer to the buttons described there.

### Context menu

You can bring up the context menu by holding `Menu` for one second. The context menu provides useful commands for the current emulator context, which either be "OS" or "In-Game context".

> **NOTE:**  
> Bringing the context menu while in-game will pause the game. Note that for games not designed especifically for Kate, "pause" mostly means that none of the button input will be forwarded to the game window; the game will continue running normally otherwise.

In the "OS" context you can:

- **Power off**: closes the emulator (only available in the **Native** mode);
- **Fullscreen**: puts the emulator in or out of full-screen mode. Mostly useful in mobile phones where the screen is partly taken by address bars and such;
- **Install cartridge**: installs a cartridge from a `.kart` file (see [Kate Cartridges](#kate-cartridges) for details);

In the "Game" context you can:

- **Close game**: closes the game and returns to the OS context;
- **Fullscreen**: puts the emulator in or out of fullscreen. Note that you can't put just the game in full-screen for now;
- **Legal notices**: opens the licenses and other important legal information for the current game;
- **Media gallery**: opens the media gallery filtered by screenshots and videos for the current game;

### Screenshots and captures

You can take a screenshot of a game that has opted to support it by pressing the `Capture` button once. You can start recording a video by holding the `Capture` button for one second. Hold it again for another second to stop recording and save the video.

Both screenshots and videos are stored in the emulator, counting towards the cartridge's storage usage. Through the Media Gallery application you can view them, delete them, and download to your device's files from there.

> **NOTE:**  
> Kate is not always recording, so holding the capture button to save the last N seconds as a video, which is common in other consoles, does not currently work. This is a feature that will be added to the emulator in the future.
>
> Audio is, likewise, not currently recorded with the video, but will be in a future version.

## Kate modes

The Kate emulator is distributed in multiple forms (called "modes"), and they have slightly different capabilities:

- **Native Application**: the [Electron][] based emulator you can install as a native app on Windows, Linux, and MacOS;
- **Web Application**: the online emulator you can run by accessing https://kate.qteati.me
- **Single Application**: a special version of the emulator packaged with a single game for developers to publish on a platform like Itch.io.

The **Web Application** mode has limited functionality and may require you to touch or click the emulator at least once before gamepad support, audio, and other features are enabled.

The **Single Application** mode cannot install games, it's designed to run a single cartridge that is bundled with it. As a player, this is not a mode you download to play other games, but it's one you may come across online outside of https://kate.qteati.me.

You can always check which mode the emulator is running by going to `Applications -> About Kate` and checking the `System` section.

> **NOTE:**  
> Due to privacy restrictions in browsers to avoid tracking and fingerprinting, the `Host` and `Hardware` sections cannot be made accurate in the **Web** and **Single** modes. If you experience problems running Kate in these modes, please attach some additional information about the browser and device you're using when reporting the issue.

## Kate cartridges

Games for Kate are packaged in a special binary format called a Kate Cartridge (with the `.kart` extension). Cartridges contain the complete data for a video game or application that runs, sandboxed, in Kate. You can think of it like a ROM in other common emulators.

You install games by dragging cartridge files from your computer and dropping them on top of the Kate emulator. In devices where dragging files is not easily achievable, like in mobile phones, you can install cartridges by holding down `Menu` for one second, and then selecting `Install cartridge`. This will open up a file picker where you can choose the `.kart` file to install.

You can uninstall games by focusing them in the `Home` screen, then pressing `Menu` and choosing `Uninstall`. Uninstalling will remove the cartridge meta-data and files, but will leave behind save files and screenshots/videos captured from that game.

Kate limits cartridges to a maximum size of 512MB. This is close to what you would get if the game was packaged as a CD in the 2000s. It's a reasonable choice given Kate's hardware limitations, but also helps users have more space to install games. Sharing (space) is caring!

Once installed you can run the game at any time without needing to keep the `.kart` file around. However, it's good to keep your `.kart` files in some backup storage (such as a CD, an external hard disk, or in cloud storage) so that you can delete games that you're not actively playing anymore to make up space on your device, and later come back to them by re-installing from the same cartridge file.

### What's sandboxing?

Kate cartridges are sandboxed for security. This means that, by default, cartridges in Kate can do five things:

- Read files that were packaged with the cartridge (but only those files!);
- Play sounds through your device's audio output;
- Display things on the small 800x480 piece of screen made available to them by the emulator;
- React to your input, provided to the cartridge in terms of Kate buttons pressed or released;
- And store very small amounts of data, of up to 32MB, used for save files.

For anything else, the game will need to ask you for permission, and you may choose to allow them to do it (if you trust the cartridge enough), or not. This is not much different from how your phone requires applications to ask for permission to use the camera or microphone, Kate just takes it a bit further to protect privacy as well.

Unlike phones, note that Kate does not allow cartridges to make any online connections by default. This is both for privacy (e.g.: a cartridge would not be able to profile your device to track you elsewhere), and for security (e.g.: many malicious applications steal sensitive information and need to send it somewhere on the internet).

By doing this Kate makes it possible for you to download a `.kart` file from anywhere, install it in a Kate emulator, and play the game without being as careful with it as you would have to downloading a native executable. If the cartridge turns out to be malicious in the end, as long you don't give it more permissions than the default ones there isn't much damage it can do.

> **IMPORTANT NOTE:**  
> In the **Single Application** mode there are no security or privacy guarantees that Kate can make. That's because whoever is distributing the Kate emulator to you controls those guarantees instead. You'd have to trust that they're upholding all of the guarantees we describe here first.

## KateOS applications

Kate comes bundled with a few applications for managing installed games and captured media. Currently it consists of:

### Home

The Home screen lists all games installed in the console, sorting them from mostly recent installed/played to least recent. You can use (![Left and Right in the D-Pad](./img/h-dpad_16.png)) to select a cartridge. (![Menu](./img/menu_16.png)) will bring up a list of things you can do with it, and you can run a cartridge by touching its cover art, or by pressing (![Ok](./img/ok_16.png)) when it's focused.

Pressing (![L](./img/l_16.png)) takes you to the Applications list.

### Media Gallery

The Media Gallery screen lists all screenshots and videos you've captured (potentially filtered by a specific game). You can use (![D-Pad](./img/dpad_16.png)) to select one of the files, and (![Ok](./img/ok_16.png)) to open it.

Once opened, you can delete or download the file by pressing (![Menu](./img/menu_16.png)) and choosing the respective option there. Bulk deletions are not currently supported, but planned for a future version.

### About Kate

The About Kate screen displays the version of Kate you're running and other information about your device, which you can then use when reporting an issue in the emulator to help diagnosing the problem.

This page also contains the "Third Party licences", which tells you what software and assets are included in Kate, and how they're licensed to you; as well as the "Release Notes" for the version you're running, which tells you what features were added, changed, or removed, and what bugs were addressed in it.

## Storage and privacy

In Kate, data is only ever stored locally, on your device. The Kate emulator itself never sends any of your data over the internet, although cartridges might **if** you give them network access, which is disabled by default.

There's four kinds of data about the cartridges you run that are stored:

- **The cartridges' data**: this is the data from the cartridges themselves. Kate copies the data from the cartridge into your local storage in a format that's more efficient and memory conscious for running games.

  The Kate emulator can read any cartridge's data, but each cartridge can only read its own files; for cartridges, it's as if no other cartridge existed in the console.

  Cartridge data is never modified; it is a read-only format. It might, however, be deleted if you choose to uninstall a cartridge.

- **The additional cartridge data**: these are things like save files and other pieces of data associated with a particular cartridge. Games can store any piece of data up to their storage quota (by default, 32 MB), and they may ask you to increase their quota as well.

  Each cartridge can read, modify, and delete its own additional data, but never other cartridge's data.

  The Kate emulator can delete this additional data on your request, but it will delete _all_ of it or none of it, to ensure that cartridges never see inconsistent data they stored.

- **The cartridge captures**: these are screenshots and gameplay recordings of cartridges in Kate. Screenshots and captures are only created from your own action: if you don't press the capture button, there will be no captures created. Kate does not impose a limit on how many captures you can store, it's only limited by your own device's own storage.

  The Kate emulator can read and modify capture data (e.g.: for re-encoding videos), however it never **changes** or deletes the data without your explicit action.

  Cartridges cannot read, modify, or delete this data. Even if they were captured from the cartridge itself. However, in the future, you'll be able to selective share your captures with the cartridge.

- **The gameplay habits**: these are things like when a cartridge was last executed on the emulator, or how many hours you've spent running a cartridge. Kate collects this data by default and stores locally. It's used by Kate only for sorting and filtering cartridges in your library.

  The Kate emulator will read this data when displaying cartridges, and will modify it both when you run a cartridge and when you close it. It also updates play time every 10 minutes of game play.

  Cartridges cannot read, modify, or delete this data. Even data about its own play habits.

---

[std-gamepad]: https://www.w3.org/TR/gamepad/#remapping
[electron]: https://www.electronjs.org/
