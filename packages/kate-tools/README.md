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

Kate's command line tools are released under the
[Mozilla Public License v2.0][mpl]. The following header should be present in
the relevant files:

```
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
```

Kate is [free software][free] under a [copyleft][] licence. You'll
always be able to obtain the source code for it, and you'll always be able to
audit what you're running. If you modify Kate _and distribute
your modified version to others_, you'll need to make available the
source code for those modifications and the build instructions as well.
The recipients of your modified copy should continue to have the same rights.

Note that the MPL does not grant you trademark, logo, and similar rights. It
also does not require you to release source code for things you make with
MPL-licenced code---only changes to specifically MPL-licenced code. See
[Mozilla's FAQ on MPL][faq].
