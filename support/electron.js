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

const { exec } = require("./utils");
const OS = require("os");
const Path = require("path");
const FS = require("fs");
const HTTPS = require("https");
const Streams = require("stream/promises");
const Crypto = require("crypto");
const electron_checksum = require("./electron-checksum");

const version = `v${require("../package.json").devDependencies.electron}`;
if (!/^v\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Invalid version for electron: ${version}`);
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    HTTPS.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        fetch(res.headers.location).then(resolve, reject);
      } else if (res.statusCode === 200) {
        resolve(res);
      } else {
        reject(new Error(`GET ${url} failed with ${res.statusCode}`));
      }
    });
  });
}

function electron_platform() {
  switch (process.platform) {
    case "win32":
      return "win32";
    case "linux":
      return "linux";
    case "darwin":
      return "darwin";
    default:
      throw new Error(`Not supported ${process.platform}`);
  }
}

function electron_arch() {
  switch (process.arch) {
    case "arm64":
      return "arm64";
    case "x64":
      return "x64";
    case "ia32":
      return "ia32";
    default:
      throw new Error(`Not supported ${process.arch}`);
  }
}

function make_electron_name(platform = electron_platform(), arch = electron_arch()) {
  return `electron-${version}-${platform}-${arch}.zip`;
}

async function fetch_checksum() {
  const remote_url = `https://github.com/electron/electron/releases/download/${version}/SHASUMS256.txt`;
  const res = await globalThis.fetch(remote_url);
  return await res.text();
}

async function download_electron(filename, force = false) {
  const remote_url = `https://github.com/electron/electron/releases/download/${version}/${filename}`;
  const dest_path = Path.join(__dirname, "..", ".cache", filename);
  if (FS.existsSync(dest_path) && !force) {
    console.log("> Using cached", filename);
    return;
  }

  console.log("> Downloading", filename);
  FS.mkdirSync(Path.dirname(dest_path), { recursive: true });
  const res = await fetch(remote_url);
  await Streams.pipeline(res, FS.createWriteStream(dest_path));
  const hash = Crypto.createHash("sha256")
    .update(FS.readFileSync(dest_path))
    .digest()
    .toString("hex");
  const expected = electron_checksum.get(filename);
  if (hash !== expected) {
    throw new Error(`Integrity check failed for ${filename}: expected ${expected}`);
  }
}

function unzip_electron(filename, dest) {
  try {
    switch (OS.platform()) {
      case "win32": {
        exec(
          `powershell.exe -Command "Expand-Archive .cache/${filename} -DestinationPath ${dest}"`
        );
        break;
      }

      case "linux":
      case "openbsd":
      case "freebsd":
      case "darwin":
        exec(`unzip .cache/${filename} -d ${dest}`);
        break;

      default:
        throw new Error(`: Platform ${OS.platform()} is not supported`);
    }
  } catch (_) {
    console.log(
      `Could not unzip electron automatically, you should unzip .cache/${filename} in the ${dest} folder.`
    );
  }
}

module.exports = {
  platform: electron_platform,
  arch: electron_arch,
  make_name: make_electron_name,
  download: download_electron,
  unzip: unzip_electron,
  fetch_checksum,
};
