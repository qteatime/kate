#!/usr/bin/env node
/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
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
