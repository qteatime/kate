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

const { copy, copy_tree, make, pack } = require("./utils");
const Path = require("path");
const FS = require("fs");
const electron = require("./electron");
const version = require("../package.json").version;

function rebrand_win(arch) {
  const root = `dist/release/kate-v${version}-win32-${arch}`;
  FS.renameSync(Path.join(root, "electron.exe"), Path.join(root, "Kate.exe"));
}

function rebrand_linux(arch) {
  const root = `dist/release/kate-v${version}-linux-${arch}`;
  FS.renameSync(Path.join(root, "electron"), Path.join(root, "kate"));
  FS.chmodSync(Path.join(root, "kate"), 0o0755);
}

async function gen_unsigned_zip(platform, arch) {
  const filename = electron.make_name(platform, arch);
  await electron.download(filename, false);
  const dest = `dist/release/kate-v${version}-${platform}-${arch}`;
  FS.rmSync(dest, { force: true, recursive: true });
  FS.rmSync(`${dest}.zip`, { force: true });
  FS.mkdirSync(dest, { recursive: true });
  await electron.unzip(filename, dest);
  copy_tree("packages/kate-desktop/app", Path.join(dest, "resources/app"));
  copy(
    "packages/kate-desktop/electron-package.json",
    Path.join(dest, "resources/app/package.json")
  );
  FS.renameSync(Path.join(dest, "LICENSE"), Path.join(dest, "LICENSE.electron.txt"));
  copy("README.md", Path.join(dest, "README.md"));
  copy("LICENCE.txt", Path.join(dest, "LICENCE.kate.txt"));

  switch (platform) {
    case "win32":
      rebrand_win(arch);
      break;

    case "linux":
      rebrand_linux(arch);
      break;
  }

  await pack(dest);
}

module.exports = {
  gen_unsigned_zip,
};
