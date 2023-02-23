# Kate — A platform for storytelling

> **NOTE**: This document presents the vision for Kate, but not all features described here are implemented yet. [Refer to the roadmap](./README.md#roadmap) in the readme for the current development status.

Imagine if gaming consoles weren't just a tool for passively consuming things. Imagine if they also encouraged people to make their own games, and even, respectfully, build upon others' works. Imagine if consoles allowed and encouraged people to modify the console and OS as they pleased to suit their needs, rather than require people to adapt to the console. Most of all, imagine if gaming in general respected your time, privacy, needs, and personal/social boundaries.

Kate is a fantasy handheld console designed with that goal in mind. It has been designed primarily for simpler story-rich games, like Visual Novels, Interactive Fiction, and 2d RPGs; though it supports any genre of game in its underlying technology.

As a fantasy console, Kate is based on real hardware specifications. You could make a Kate console yourself, if you wanted, but there's no real hardware for it that you can buy. Instead, you run an emulator of these hardware specifications, allowing you to play Kate games from a Windows, Mac, or Linux machine. Or right from your web-browser. Indeed, you can install https://kate.qteati.me/ as a local web application in your phone, tablet, or computer, and run it offline—all Kate games are installed locally in your machine, just as in older consoles.

## Hardware specifications

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

## Sharing games safely

As a console that encourages people to build a community around video games as an art form, and to take active part in it, _safety_ is one of the most important aspects of Kate.

If you share a native executable for a regular operating system, players first need to figure out if they trust you enough to give full control over their machine—as regular operating systems have no real tools for limiting what native executables may do.

This makes sharing small games particularly troublesome, and folks often use web browsers to alleviate the tension. Web browsers are good at sandboxing, but they're inconsistent in what features they support, and make assumptions about network usage that don't really make sense for video games. On top of that, any time players want to replay the game, they must have a very good connection to the internet, and be ready to download copious amounts of data again.

Kate keeps the sandboxing aspect of web browsers and tries to address the other two:

- Games packaged for Kate should run in a platform with known guaranteed features; and
- Games packaged for Kate are installed in the player's device and run fully locally, no internet connection necessary.

These three aspects combined make Kate an appropriate platform for distributing games made for Jams, or non-commercial games in general. Kate does not have (and will never have) any form of copy protection or obfuscation. It's a player-first platform. Commercial games aren't unsupported in Kate, but anyone wanting to make a commercial game for the platform would have to keep in mind that there is no technology to make copying and sharing files harder for players, and such technology will never be built in the official release.

### Kate's capability model

Kate is a capability-based console with a capability-based operating system. If the concept of capabilities is new to you, [the Crochet documentation describes it in detail](https://crochet.qteati.me/docs/reference/system/security/why.html), but you can think of it as the permissions model on your phone.

Every time you install an application in Kate, you need to decide what you're okay with having that application do. These permissions are called "capabilities", and they're at the core of Kate's sandboxing model. By not allowing games to do dangerous things without the player's explicit consent, downloading a random Kate cartridge from the internet and running it on the console can do little to no damage to one's computer.

## Sustainable nostalgia

As a platform that isn't made just for passive consumption of games, Kate also aims to bring back some of the nostalgia from appreciating the art surrounding the game itself—its conception, ideas, additional illustrations, OSTs; as well as supporting a more vibrant fan-feedback and fandom culture.

Additional cartridge art, game booklets, art books, and special editions are all nice, but the use of additional resources for them and space requirements are not always justifiable. Kate tries to address this by allowing cartridges to include additional print-based media right in the cartridge data, and then provide tools for browsing this additional content right in the console. Or actually print it for oneself.

Indeed, in a world where resource usage was less of a concern, Kate's games would likely be distributed as a mini-CD along with an A6-sized artbook/booklet, which would double as the game's case.

Kate never runs games directly from external media, so the format of the external media is not really important—as long as Kate has a way of transferring the cartridge ROM from it to the internal console storage. Kate is meant to be a ROM-based console, even in its physical form, but if a player has an external media for archival they can always re-install the game later if they need to delete it to make space for others at some point.

## Making one's own library

Since Kate is designed for digital distribution **and** primarily small games, it's quite likely that one would end up with a fair amount of them. To that end Kate must provide support for building and managing a digital library of games.

Kate does this by having each cartridge include necessary meta-data about the game (things like what genre it is, what audience it's aimed at, which languages or accessibility features it provides), coupled with data Kate gathers locally about the player's actions, and then uses that to allow searching for games and building manual or dynamic collections of subsets of the library.

### Online repositories

Rather than stores where games can be purchased, Kate aims to integrate repositories where games can be searched and downloaded from. A repository here is a web server that implements the Kate Repository API, and provides meta-data about different game cartridges, along with links that can be used to download them.

Kate maintains this repository locally, and synchronises it with the repositories with minimal data transfer. That means that all searches through repositories actually happen locally, not over the internet; only downloading cartridges requires an internet connection. Every other action: browsing, bookmarking, etc; happens entirely locally in the console.

### Habits and play meta-data

Modern consoles and platforms have popularised a form of looking at how you've played games in the past, and even recommending games based on that. This is not without concerns, as data gathering and analysis can be quite iffy, but some players enjoy looking back at things and seeing what they've been up to. Some players also keep manual diaries.

In Kate, any form of online data gathering is completely out of consideration. But that doesn't mean the console can't record the player's habits locally and make the data available for the player to use however they wish, if they do want that.

In this sense Kate can record play sessions and make the data available for helping players manage their collection. For example, a player may choose to create a dynamic collection based on games they've played in 2020, and then sort that collection based on the time they spent in each that year. Since the data is available locally in a structured format, players can also choose to do their own data analysis however they wish. It's their data, and it's their decision how to use it, or if they want to share any part of it at all.

### Social aspects of play

Some players like to share what they've been up to with others. Consoles have made this easier by supporting screenshotting or capturing moments of gameplay with the touch of a button, and then connecting to social media directly to share it.

Kate supports screenshots and captures of up to 15 seconds of past gameplay through the "Capture" button—touch to screenshot, hold to save the last 15 seconds as a video. Files are stored locally and can be exported to regular image, video, or gif formats, so the player is free to use the exported files however they want.

## Making one's own games

While making one's own video game is not the only aspect that makes a console be not designed for passive consumption—writing fanfiction, using one's captured content for writing essays and reviews, etc. are all far from "passive" consumption, and Kate supports those through other means—making one's own video game for a console is a very active way of interacting with a console.

Kate supports this in three ways:

- **Compatibility with web games**: through the use of Bridges, small pieces of code injected in the cartridge to emulate Web's features with Kate's APIs, many web games can be packaged for Kate with minimal changes to them, and still enjoy the same sandboxing features games made _for_ Kate do.

- **A suite of open development tools**: Kate itself is an open-source console. All tools for making games with it (and official games by the developer) are also free and open. This makes developing games a lot more accessible in terms of resources.

- **An encouragement of mod-culture**: Modding—taking an existing video game and changing it to do new things—can be an easier way of getting into video game development, and Kate wants to support this responsibly, by letting original developers express if, how, and to what extent they want to allow players to mod their game, as well as setting a set of community expectations on respecting original developers' wishes.

For all of these the baseline provided by Kate are command line tools for packaging games as Kate cartridges, as well as exporting cartridges to standalone web games or native executables. Developers are otherwise free to use any other tool they want for making games, as all technologies Kate uses are open and standard.

### Kate Studio

Though one does not _need_ any Kate-specific development tool for making games—they can use any tool that supports web exports—making a game development tool available directly in the console makes it a lot easier for people to get started with making their own games, or for developers to support modding in their games if they wish for that.

Kate Studio is then a very specific tool for making Kate-specific games, particularly aimed at non-professional developers who want to make their own visual novels, interactive fiction, and RPGs. Other kinds of 2D games are similarly supported, but developers need to do more of the heavy lifting there.

## Making one's own console

Finally, Kate itself can be modified by anyone. OS Mods are a capability-based extension point that allows any player to extend Kate to do new things, and similarly share these mods with other players.

OS extensions are very dangerous, and therefore require a far more grounded security model than games would; thankfully the capability model used by Kate's default sandboxing works just as well for this use case, so making extensions for the console itself is not that different from making a video game, you just request a different set of APIs and data access to the user, who can then decide if they're okay with taking that risk.

Mods are essential for accessibility. As much as Kate wants to be a console that can be used by as many people as possible, inevitably there will be players whose circumstances and needs for access are not covered by the standard distribution—mods meet these people's needs directly, by allowing them to just adapt the console to their needs, rather than having to adapt themselves to the console. And Kate's capability-based model makes this as safe as possible even if they end up downloading their mods from someone else instead of making one themselves.
