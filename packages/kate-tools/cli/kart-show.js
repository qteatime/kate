#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
