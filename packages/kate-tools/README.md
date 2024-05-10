# kate-tools

This package provides a few simple tools for packaging games for Kate:

- `kart` --- generates Kate cartridge (`.kart`) files from web applications with a special `kate.json` configuration;

- `kate-dist` --- generates a standalone webpage that embeds a Kate emulator for a specific Kate cartridge, which allows you to publish it as a web game in platforms like Itch.io

- `kate-show` --- shows the contents of a Kate cartridge and checks for file corruption.

## Installation

Make sure you have [Node.js 16+](https://nodejs.org/en). Get it from npm:

    $ npm install @qteatime/kate-tools

If you're running the Preview version of Kate (https://kate-nightly.qteati.me),
then you'll likewise need the preview version of the tools:

    $ npm install @qteatime/kate-tools@preview

## Usage

See `kart help`, `kate-dist help`, and `kate-show help`.

## Licence

Kate's command line tools are released under the GNU GPL version 2 or later.
See `LICENCE.txt` for details.
