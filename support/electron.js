/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { exec } = require("./utils");
const OS = require("os");
const Path = require("path");
const FS = require("fs");
const HTTPS = require("https");
const Streams = require("stream/promises");
const Crypto = require("crypto");
const electron_checksum = require("./electron-checksum");

const version = "v26.3.0";

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
};
