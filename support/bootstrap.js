#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
      FS.rmdirSync("electron", { recursive: true, force: true });
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
