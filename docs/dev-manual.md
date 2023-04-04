# Making games for Kate!

> **NOTE**: This is a living document. Information here applies to Kate v0.23.4

Kate is a fantasy hand-held console for small 2d applications, particularly RPGs, Visual Novels, and similar story-driven games. You can build real games that run in the console, which you distribute to your players as a single `.kart` file they can install and run offline, at their convenience, in any device.

Kate supports Windows, Linux, and MacOS natively, and supports many other platforms with a modern web-browser (e.g.: iOS and Android). When programming for Kate you program for a single platform, distribute a single file, and allows players to run the game anywhere, as well as synchronise their data among their devices, without any additional programming on your side.

This manual describes how to make games for Kate with a hands-on approach, as well as diving into some of its technical details and approach to security and privacy.

For an end-user documentation, see [The Kate Manual](./user-manual.md).

## Before you start

### What's Kate and why should I care?

Kate is a fantasy console. This essentially means that while the hardware specifications are real, there is no off-the-shelf device that users can buy from a store. Rather, users will mostly be running an emulator for the real Kate device on their computer (or phone/smartdevice). Think of how people can run games made for 90s and 00s era consoles in their desktop computers nowadays; Kate is similar.

But unlike most commercial consoles, Kate is first and foremost a platform _for players_. This means that we want to respect their security, privacy, and agency as much as possible. We want players to be able to download any random game they find on the internet and run it, safely, even if the game turns out to be malicious in the end. Kate goes to great lengths to make this possible, through sandboxing. We'll come back to this later.

As a developer, by making a game for Kate you get to:

- Distribute your game as a single file, which users can install and play offline in any platform the Kate emulator runs on;

- Avoid players being overly cautious of downloading a small game packaged as a native executable because they have been a victim of malware before;

- Have the option of package the emulator with your game as a webpage, which can then be used to provide a web-playable version in a platform like Itch.io, or on your own site;

- Use the same game making tools you're already familiar with, as long as they have an option to make a web export; and

- Avoid having to deal with optimising download sizes for your files so players don't have to wait a long time to start the game.

On top of the APIs that the are provided in the web platform, Kate adds its own game-specific APIs that have a baseline expectation among players, so you don't have to keep re-explaining yourself.

These APIs include things like safe additional storage for your save data, support for screenshot and video capture of game-play, simplified input handling where you don't need to care if the player is using a touch-screen, a keyboard, a gamepad, or another device, etc.

### What will I need?

The tools used to package Kate games currently require [Node.js](https://nodejs.org/en) to be installed, so you will need a device capable of installing it. Node.js supports Windows, MacOS, and Linux.

You'll also need to be familiar with [the command line](https://en.wikipedia.org/wiki/Command-line_interface) and with the basics of [web development](https://developer.mozilla.org/en-US/docs/Learn).

There's a planned tool called Kate Studio which will allow you to build games for Kate directly from your browser, but that tool is not here yet.

Once you have Node.js installed, you can install the set of tools for building and running Kate games from the command line:

```shell
$ npm install -g @qteatime/kate-tools@experimental
$ npm install -g @qteatime/kate-desktop@experimental
```

> **NOTE:**  
> The `$` just indicates that you should run these commands as your user, not with the administrator account. You should not type the `$` when running these commands.
>
> Also note that running commands with an administrator account is far too dangerous, and should not be done without understanding the consequences. Make sure you're running your command line shell (such as PowerShell, CMD, or Bash) as a regular user!

After you run these commands you should have three new applications available in the command line:

- **kart** is used for packaging your games into a single `.kart` file that you can distribute to players;
- **kate-dist** is used for bundling a `.kart` file and the Kate emulator into a web page, which you can then upload to a platform like Itch.io. You'll need to zip the contents of the generated folder separately.
- **kate-desktop** is the native version of the Kate emulator, which you'll use to test your games. You can also test it by accessing the online version at https://kate.qteati.me, which is useful if you want to check how your game runs on an iPhone, iPad, or Android device.

## Getting started

To follow along you'll only need a text editor (such as [Visual Studio Code](https://code.visualstudio.com/)) and the Kate Tools package.

### Your first cartridge

Let's start by just trying to get something to show up on the screen, to make sure everything is set up correctly and your Kate emulator can play games.

To begin with we'll create an HTML page. All Kate cartridges eventually start there, since the console is based on the web platform.

Create a file called `index.html` in your text editor with the following contents:

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        color: black;
      }
    </style>
  </head>
  <body>
    <h1>Hello, from Kate!</h1>
  </body>
</html>
```

If you open your `index.html` on a web-browser, you should see something similar to the image below:

![The text "Hello, from Kate" is shown at the centre of the screen](./img/dev/demo1.png)

Not very exciting, but hey, baby steps!

Now, we want to turn this into a Kate cartridge, which we can then install in a Kate emulator to play. To do so we'll need to create a file describing the cartridge, so the `kart` tool can do its magic.

Create a file called `kate.json`, in the same folder as your `index.html`, with the following contents:

```json
{
  "id": "my-first-cartridge",
  "metadata": {
    "game": {
      "title": "My First Cartridge"
    }
  },
  "files": ["index.html"],
  "platform": {
    "type": "web-archive",
    "html": "index.html"
  }
}
```

This file tells Kate that there's a game identified by `my-first-cartridge`. This identification **must** be unique, and we'll get into what that means later. For now, `my-first-cartridge` will work.

We also provide a more readable title, `My First Cartridge`. This is what players will see in the cartridge selection screen.

Next we tell Kate what is actually in the cartridge. Our cartridge so far is made up of a single file, `index.html`, and in order to play this file we tell Kate to use the `web-archive` format—meaning Kate will treat it as if it was a web page (of sorts). This `web-archive` format requires us to specify which web page Kate should load first; we only have one, so `index.html` it is.

With all the incantations in place, what's left is asking the `kart` application to turn this configuration into an actual cartridge. You do so by running the following command from the same directory your `kate.json` and `index.html` files are:

```shell
$ kart kate.json --output my-first-cartridge.kart
```

> **NOTE:**  
> If you're using PowerShell on Windows 10+, depending on your security settings you might see a message like the following:
>
>     kart : File C:\<...>\kart.ps1 cannot be loaded
>            because running scripts is disabled on this
>            system. For more information, see
>            about_Execution_Policies at https://...
>
> PowerShell has more restricted rules on script execution (which is good, though it would be less needed if they were sandboxed from the beginning), and the Kate Tools scripts are not signed. You **are** encouraged to review the code on https://github.com/qteatime/kate/tree/main/packages/kate-tools and at the location Windows is pointing you to, if you've installed it through `npm`.
>
> Rather than disabling PowerShell's security rules (Don't do that arbitrarily! Security rules exist for a reason!), you _may_ choose to run `kart.cmd` instead of `kart`, as a workaround, since it is not covered by the same security rules. However, once again, **you are encouraged to review your tools' code**.
>
> Arbitrarily running applications in an unsandboxed system, like Windows, can easily get your computer compromised (and risks damaging your reputation if that ends up with you distributing malware to your users unknowingly). Kate is a secure platform, and part of that security also comes from knowing what your applications are doing :)

This should create a `my-first-cartridge.kart` file in the same folder as your `kate.json` and `index.html` files. Drag and drop it on your Kate emulator (either by accessing https://kate.qteati.me/ or by running `kate-desktop` in the command line) to install. Your emulator should look like this:

![](./img/dev/demo2.png)

And if you click (or press ![Ok](./img/ok_16.png)) to play it, your emulator should look like this:

![](./img/dev/demo3.png)

From here you can either try [making a small game from scratch for Kate](#making-a-game-for-kate), or [porting a game you already have]().
