/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const FS = require("fs");
const Path = require("path");
const SHASUM = FS.readFileSync(Path.join(__dirname, "electron-shasum.txt"), "utf-8");

const checksum = new Map(
  SHASUM.trim()
    .split(/\r\n|\r|\n/)
    .map((line) => {
      const [hash, file0] = line.trim().split(/\s+/);
      const file = file0.trim().replace(/^\*/, "");
      return [file, hash];
    })
);

module.exports = checksum;
