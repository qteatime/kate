#!/usr/bin/env node
// Sets up the environment for running Kate
const execSync = require("child_process").execSync;
const execFile = require("child_process").execFileSync;
const OS = require("os");
const Path = require("path");
const FS = require("fs");
const HTTPS = require("https");
const Streams = require("stream/promises");
const Crypto = require("crypto");
const electron_checksum = require("./electron-checksum");

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

function exec(command, opts = {}) {
  console.log("$>", command);
  execSync(command, { stdio: ["inherit", "inherit", "inherit"], ...opts });
}

function exec_file(command, args, opts = {}) {
  console.log("$>", command, ...args);
  execFile(command, args, {
    stdio: ["inherit", "inherit", "inherit"],
    ...opts,
  });
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

async function download_electron(version, platform, arch) {
  const filename = `electron-${version}-${platform}-${arch}.zip`;
  const remote_url = `https://github.com/electron/electron/releases/download/${version}/${filename}`;
  const dest_path = Path.join(__dirname, "../electron/electron.zip");
  FS.mkdirSync(Path.dirname(dest_path), { recursive: true });
  const res = await fetch(remote_url);
  await Streams.pipeline(res, FS.createWriteStream(dest_path));
  const hash = Crypto.createHash("sha256")
    .update(FS.readFileSync(dest_path))
    .digest()
    .toString("hex");
  const expected = electron_checksum.get(filename);
  if (hash !== expected) {
    throw new Error(
      `Integrity check failed for ${filename}: expected ${expected}`
    );
  }
}

function unzip_electron() {
  try {
    switch (OS.platform()) {
      case "win32": {
        exec(
          `powershell.exe -Command "Expand-Archive electron/electron.zip -DestinationPath electron"`
        );
        break;
      }

      case "linux":
      case "openbsd":
      case "freebsd":
      case "darwin":
        exec(`unzip electron/electron.zip -d electron`);
        break;

      default:
        throw new Error(`: Platform ${OS.platform()} is not supported`);
    }
  } catch (_) {
    console.log(
      `Could not unzip electron automatically, you should unzip electron/electron.zip in the electron folder.`
    );
  }
}

async function main() {
  // Sets up npm
  if (args.values["npm-install"]) {
    console.log("> Installing npm dependencies");
    exec(`npm install --ignore-scripts`);
    exec(`node make dependencies`);
  }

  // Downloads Electron, if needed
  if (!FS.existsSync("electron")) {
    if (args.values["download-electron"]) {
      const version = "v24.1.2";
      const platform = process.platform;
      const arch = process.arch;
      console.log("> Downloading Electron", version, "for", platform, arch);
      await download_electron(version, platform, arch);
    }
  }
  if (args.values["unzip-electron"]) {
    console.log("> Unzipping Electron");
    unzip_electron();
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
