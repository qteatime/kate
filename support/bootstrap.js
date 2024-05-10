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

// Sets up the environment for running Kate
const { exec, assert_root } = require("./utils");
const electron = require("./electron");
const FS = require("fs");

const args = require("util").parseArgs({
  options: {
    // Run npm install when bootstrapping
    "npm-install": { type: "boolean" },
    // Download Electron artifacts when bootstrapping
    "download-electron": { type: "boolean" },
    // Call an external unzip application when bootstrapping (requires electron/electron.zip)
    "unzip-electron": { type: "boolean" },
    // Builds all Kate packages (requires npm dependencies to be present)
    build: { type: "boolean" },
  },
});

async function main() {
  assert_root("bootstrap");

  // Sets up npm
  if (args.values["npm-install"]) {
    console.log("> Installing npm dependencies");
    exec(`npm install --ignore-scripts`);
    exec(`node make dependencies`);
  }

  // Downloads Electron, if needed
  await electron.download(electron.make_name(), args.values["download-electron"]);

  // Unzips Electron
  if (args.values["unzip-electron"]) {
    console.log("> Unzipping Electron");

    if (FS.existsSync("electron")) {
      console.log("> First cleaning up electron/ directory...");
      FS.rmSync("electron", { recursive: true, force: true });
    }
    electron.unzip(electron.make_name(), "electron");
  }

  // Builds all subpackages
  if (args.values["build"]) {
    console.log("> Building all Kate packages");
    exec(`node make all`);
  }
}

main().catch((e) => {
  console.error(`---\nBootstrapping failed:\n${e?.stack ?? e}`);
  process.exit(1);
});
