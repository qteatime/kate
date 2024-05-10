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
const FS = require("fs/promises");
const { parseArgs } = require("util");
const Show = require("../build/kart-show");

const options = {
  help: {
    type: "boolean",
    short: "h",
  },
};

const {
  values: { help },
  positionals: [file],
} = parseArgs({ args: process.argv.slice(2), options, allowPositionals: true });

if (!file || help) {
  console.log(`Usage: kart-show <game.kart>
  
Shows meta-data about the cartridge.`);
  process.exit(1);
}

async function Main() {
  await Show.show(await FS.open(file));
}

Main().catch((e) => {
  setImmediate(() => {
    throw e;
  });
});
