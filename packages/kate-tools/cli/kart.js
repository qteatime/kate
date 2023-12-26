#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const { parseArgs } = require("util");
const Kart = require("../build/kart");

const options = {
  output: {
    type: "string",
    default: "game.kart",
  },
  help: {
    type: "boolean",
    short: "h",
  },
};

const {
  values: { help, output },
  positionals: [config],
} = parseArgs({ args: process.argv.slice(2), options, allowPositionals: true });

if (!config || !output || help) {
  console.log(`Usage: kart <kate.json> [--output <game.kart>]
  
Packages the game described by 'kate.json' as a Kate cartridge.
Stores the cartridge in the '--output' (default 'game.kart').`);
  process.exit(1);
}

Kart.make_cartridge(config, output);
