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
