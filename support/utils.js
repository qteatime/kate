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

const execSync = require("child_process").execSync;
const Path = require("path");
const FS = require("fs");
const OS = require("os");

function make(target) {
  const file = Path.join(__dirname, "../make.js");
  return exec(`node ${file} ${target}`);
}

function exec(command, opts = {}) {
  console.log("$>", command);
  execSync(command, { stdio: ["inherit", "inherit", "inherit"], ...opts });
}

function copy(from, to) {
  console.log("-> Copy", from, "->", to);
  FS.mkdirSync(Path.dirname(to), { recursive: true });
  FS.copyFileSync(from, to);
}

function copy_tree(from, to, filter = (x) => true) {
  console.log("-> Copy tree", from, "->", to);

  const go = (src, dst) => {
    const stat = FS.statSync(src);
    if (stat.isFile()) {
      if (filter(src)) {
        copy(src, dst);
      }
    } else if (stat.isDirectory()) {
      for (const entry of FS.readdirSync(src)) {
        go(Path.join(src, entry), Path.join(dst, entry));
      }
    } else {
      throw new Error(`Unsupported entity: ${src}`);
    }
  };

  go(from, to);
}

function assert_root(what) {
  if (Path.resolve(process.cwd()) !== Path.resolve(__dirname, "..")) {
    throw new Error(`${what} must be run from the root of the repository`);
  }
}

function zip(src, dst) {
  if (OS.platform() !== "win32") {
    throw new Error(`Only supported on windows`);
  }
  exec(
    `powershell.exe -Command "Compress-Archive -Path '${src}' -DestinationPath '${dst}' -CompressionLevel Optimal"`
  );
}

function tar(src, dst) {
  if (!["linux", "openbsd", "freebsd", "darwin"].includes(OS.platform())) {
    throw new Error(`Only supported on POSIX`);
  }

  exec(`tar -czf '../${Path.basename(dst)}' *`, { cwd: Path.resolve(src) });
}

function pack(src) {
  if (OS.platform() === "win32") {
    zip(src, `${src}.zip`);
  } else {
    tar(src, `${src}.tar.gz`);
  }
}

module.exports = {
  copy,
  copy_tree,
  exec,
  make,
  assert_root,
  zip,
  tar,
  pack,
};
