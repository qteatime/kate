#!/user/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const { parseArgs } = require("util");
const FS = require("fs");
const Path = require("path");
const { pack } = require("../build/index");

const options = {
  root: {
    type: "string",
    default: ".",
  },
  name: {
    type: "string",
    default: "Main",
  },
  out: {
    type: "string",
  },
  help: {
    type: "boolean",
    short: "h",
  },
};

const {
  values: { help, root, name, out },
  positionals: [entry],
} = parseArgs({ args: process.argv.slice(2), options, allowPositionals: true });

if (!entry || !name || help) {
  console.error(`Usage: glomp <entry.js|entry.css> [--name Entry] [--out <out.js>] [--root build]
  
Merges all modules and files required from 'entry.js' or 'entry.css' into a
single JS or CSS module. JS modules work in both Node.js and the Browser,
but not with AMD-style module loaders.

Options:

  name <string>
    Defines the global JS variable name exported in browsers where no
    require() is available. [default: "Main"]

  out <path>
    If defined, the file is written to this path. Otherwise the module is
    written to the standard output.

  root <string>
    If defined, this is the root directory for the relative __dirname and
    __filename output in the module.
  `);
  process.exit(1);
}

const code = pack(entry, root || process.cwd(), name);
if (out != null) {
  FS.mkdirSync(Path.dirname(out), { recursive: true });
  FS.writeFileSync(out, code);
} else {
  console.log(code);
}
