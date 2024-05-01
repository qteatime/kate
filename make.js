#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const execSync = require("child_process").execSync;
const execFile = require("child_process").execFileSync;
const OS = require("os");
const Path = require("path");
const FS = require("fs");
const glob = require("glob").sync;
const crypto = require("crypto");
const { copy, copy_tree, assert_root, zip } = require("./support/utils");
const gen_build = require("./support/generate-builds");
const electron = require("./support/electron.js");

class World {
  constructor() {
    this.tasks = new Map();
    this._done = new Set();
  }

  async run(name) {
    if (this._done.has(name)) {
      return;
    }
    this._done.add(name);

    const task = this.tasks.get(name);
    if (!task) {
      throw new Error(`Undefined task ${name}`);
    }
    console.log(`-> Running ${name}`);
    return await task.run(this);
  }

  task(name, dependencies, code) {
    const task = new Task(name, dependencies, code);
    this.tasks.set(name, task);
    return task;
  }

  find(name) {
    return this.tasks.get(name);
  }

  get all_tasks() {
    return Array.from(this.tasks.values());
  }
}

class Task {
  constructor(name, dependencies, code) {
    this.name = name;
    this.dependencies = dependencies;
    this.code = code;
    this.documentation = "";
  }

  async run(world) {
    for (const dependency of this.dependencies) {
      await world.run(dependency);
    }
    await this.code();
  }

  with_doc(text) {
    this.documentation = text;
    return this;
  }
}

function kart_name(directory, name) {
  const json = JSON.parse(FS.readFileSync(Path.join(directory, "kate.json"), "utf-8"));
  const version = `${json.version.major}.${json.version.minor}`;
  return Path.join(directory, `${name}-v${version}.kart`);
}

function exec(command, opts) {
  console.log("$>", command);
  execSync(command, { stdio: ["inherit", "inherit", "inherit"], ...opts });
}

function exec_file(command, args, opts) {
  console.log("$>", command, ...args);
  execFile(command, args, {
    stdio: ["inherit", "inherit", "inherit"],
    ...opts,
  });
}

function exec_file_capture(command, args, opts) {
  console.log("$>", command, ...args);
  try {
    const result = execFile(command, args, {
      ...opts,
    });
    return result.toString("utf-8");
  } catch (err) {
    if (err?.stdout) {
      console.error("-- command failed --");
      console.error("Output:");
      console.error(err.stdout.toString("utf-8"));
      console.error("Error:");
      console.error(err.stderr.toString("utf-8"));
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

function glomp({ entry, out, name }) {
  const { pack } = require("./packages/glomp/build/index.js");
  const code = pack(entry, __dirname, name ?? "Main");
  FS.mkdirSync(Path.dirname(out), { recursive: true });
  FS.writeFileSync(out, code);
  console.log(`-> Glomp packaged (${entry}) to (${out})`);
}

function npm_install(project) {
  exec(`npm install --ignore-scripts`, { cwd: project });
}

function tsc(project) {
  const file = Path.join(__dirname, "node_modules/typescript/bin/tsc");
  exec_file("node", [file, "-p", project]);
}

function tsc_file(source, target) {
  const file = Path.join(__dirname, "node_modules/typescript/bin/tsc");
  exec_file("node", [file, "--declaration", "--outDir", target, source]);
}

function ljtc(kind, file, target) {
  const cmd = OS.platform() === "win32" ? "crochet.cmd" : "crochet";
  const result = exec_file_capture(cmd, ["ljtc", "--", kind, file]);
  FS.writeFileSync(target, result);
}

function pack_assets({ glob: pattern, filter, name, target }) {
  const files = glob(pattern, { absolute: true }).filter((x) => filter(x));
  const data = Object.fromEntries(
    files.map((x) => [Path.basename(x), FS.readFileSync(x, "utf-8")])
  );
  const content = `export const ${name} = ${JSON.stringify(data, null, 2)};`;
  FS.writeFileSync(target, content);
}

function electron_name() {
  switch (OS.platform()) {
    case "mas":
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "freebsd":
    case "openbsd":
    case "linux":
      return "electron";
    case "win32":
      return "electron.exe";
    default:
      throw new Error(`Electron builds are not available on ${OS.platform()}`);
  }
}

function kart({ config, output }) {
  exec_file("node", ["packages/kate-tools/cli/kart.js", "--output", output, config]);
}

function playwright(args) {
  exec_file("node", ["node_modules/playwright/cli.js", ...args]);
}

function clean_build(root) {
  remove(Path.join(root, "build"), { recursive: true, force: true });
  remove(Path.join(root, "tsconfig.tsbuildinfo"), { force: true });
  for (const cart of glob("*.kart", { cwd: root })) {
    remove(Path.join(root, cart), { force: true });
  }
}

function remove(path, { recursive, force } = { recursive: false, force: false }) {
  if (!FS.existsSync(path) && force) {
    return;
  }

  console.log("--> Removing", path);
  FS.rmSync(path, { recursive: recursive ?? false, force: force ?? false });
}

function make_npm_package({ source, build }) {
  const from = Path.join("packages", source);
  const to = Path.join("dist/npm", source);
  const cp = (src, dst) => {
    copy(Path.join(from, src), Path.join(to, dst ?? src));
  };
  const mcp = (src, dst) => {
    if (FS.existsSync(Path.join(from, src))) {
      cp(src, dst);
    }
  };
  const ct = (src, dst) => {
    copy_tree(Path.join(from, src), Path.join(to, dst ?? src));
  };
  const glomp_deps = (root) => {
    for (const dep of FS.readdirSync(Path.join(from, root, "deps"))) {
      if (Path.extname(dep) === ".js") {
        glomp({
          entry: Path.join(from, root, "deps", dep),
          out: Path.join(to, root, "deps", dep),
          name: Path.basename(dep),
        });
      }
    }
  };

  console.log("--> Packaging", source, "as a npm package");
  remove(to, { recursive: true, force: true });
  FS.mkdirSync(to, { recursive: true });
  cp("package.json");
  mcp("package-lock.json");
  mcp("README.md");
  copy("LICENCE.txt", Path.join(to, "LICENCE.txt"));
  build({ from, to, copy: cp, maybe_copy: mcp, copy_tree: ct, glomp_deps });
  console.log("--> Dry-running npm-pack for", source);
  exec("npm pack --dry-run", { cwd: to });
}

const w = new World();

// -- Licences
w.task("licences:generate", [], () => {
  for (const file of glob("**/LICENCE.in")) {
    const target = Path.join(Path.dirname(file), "LICENCE.txt");
    if (!FS.existsSync(target)) {
      console.log("-> Generating", target);
      let data = FS.readFileSync(file, "utf-8");
      data = data.replace(/\{\{([^\}]+)\}\}/g, (_, path) => {
        return FS.readFileSync(path, "utf-8");
      });
      FS.writeFileSync(target, data);
    }
  }
});

// -- Util
w.task("util:compile", [], () => {
  tsc("packages/util");
});

w.task("util:build", ["util:compile"], () => {});

// -- Glomp
w.task("glomp:compile", ["util:build"], () => {
  tsc("packages/glomp");
});

w.task("glomp:build", ["glomp:compile"], () => {});

w.task("glomp:clean", [], () => {
  clean_build("packages/glomp");
});

w.task("glomp:make-npm-package", ["licences:generate", "glomp:build"], () => {
  make_npm_package({
    source: "glomp",
    build: (b) => {
      b.copy_tree("bin");
      b.copy_tree("build");
      b.glomp_deps("build");
    },
  });
});

// -- LJT
w.task("ljt:compile", ["util:build"], () => {
  tsc("packages/ljt-vm");
});

w.task("ljt:build", ["ljt:compile"], () => {});

// -- Schema
w.task("schema:generate", [], () => {
  FS.mkdirSync("packages/schema/source/generated", { recursive: true });
  for (const file of glob("*.ljt", { cwd: "packages/schema/schemas" })) {
    const name = Path.basename(file, ".ljt");
    ljtc(
      "json",
      `packages/schema/schemas/${file}`,
      `packages/schema/source/generated/${name}.json`
    );
    ljtc(
      "ts-types",
      `packages/schema/schemas/${file}`,
      `packages/schema/source/generated/${name}.ts`
    );
  }
});

w.task("schema:compile", ["ljt:build"], () => {
  for (const file of glob("**/*.json", { cwd: "packages/schema/source" })) {
    copy(Path.join("packages/schema/source", file), Path.join("packages/schema/build", file));
  }
  tsc("packages/schema");
});

w.task("schema:build", ["schema:compile"], () => {});

// -- DB Schemas
w.task("db-schema:compile", [], () => {
  tsc("packages/db-schema");
});

w.task("db-schema:build", ["db-schema:compile"], () => {});

// -- API
w.task("api:compile", ["util:build"], () => {
  tsc("packages/kate-api");
});

w.task("api:build", ["api:compile"], () => {});

// -- Bridges
w.task("bridges:compile", ["api:build"], () => {
  tsc("packages/kate-bridges");
});

w.task("bridges:bundle-api", ["api:build", "glomp:build"], () => {
  glomp({
    entry: "packages/kate-api/build/index.js",
    out: "packages/kate-bridges/build/kate-api.js",
    name: "KateAPI",
  });
});

w.task("bridges:generate", ["bridges:compile", "bridges:bundle-api"], () => {
  pack_assets({
    glob: "packages/kate-bridges/build/*.js",
    filter: (x) => !x.endsWith("/index.js"),
    name: "bridges",
    target: "packages/kate-bridges/source/index.ts",
  });
  tsc_file("packages/kate-bridges/source/index.ts", "packages/kate-bridges/build");
});

w.task("bridges:build", ["bridges:generate"], () => {});

// -- Core
w.task(
  "core:compile",
  ["schema:build", "bridges:build", "util:build", "db-schema:build", "ljt:build"],
  () => {
    tsc("packages/kate-core");
  }
);

w.task("core:build", ["core:compile"], () => {});

// -- DOM UI
w.task("domui:generate", [], () => {
  pack_assets({
    glob: "packages/kate-domui/assets/*",
    filter: () => true,
    name: "assets",
    target: "packages/kate-domui/source/assets.ts",
  });
});

w.task("domui:compile", ["api:build", "util:build", "domui:generate"], () => {
  tsc("packages/kate-domui");
});

w.task("domui:build", ["domui:compile"], () => {});

// -- APP UI
w.task("appui:compile", ["api:build", "util:build"], () => {
  tsc("packages/kate-appui");
  copy_tree("www/fonts", "packages/kate-appui/assets/fonts");
  copy_tree("www/img/buttons", "packages/kate-appui/assets/img/buttons");
  glomp({
    entry: "packages/kate-appui/assets/css/index.css",
    out: "packages/kate-appui/www/kate-appui.css",
  });
});

w.task("appui:build", ["appui:compile"], () => {});

// -- Tools
w.task("tools:dependencies", [], () => {
  npm_install("packages/kate-tools");
});

w.task("tools:compile", ["schema:build"], () => {
  tsc("packages/kate-tools");
});

w.task("tools:build", ["tools:compile", "www:bundle"], () => {
  remove("packages/kate-tools/packaging/web", { recursive: true, force: true });
  copy_tree("www", "packages/kate-tools/packaging/web", (src) => {
    return !(
      src.endsWith("loader.js") ||
      src.endsWith("manifest.json") ||
      src.endsWith("index.html") ||
      src.endsWith("versions.json") ||
      /kate-.*?\.js$/.test(src) ||
      /RELEASE-.*?\.txt$/.test(src)
    );
  });
  glomp({
    entry: "packages/kate-core/build/index.js",
    out: `packages/kate-tools/packaging/web/kate.js`,
    name: "Kate",
  });
  glomp({
    entry: "packages/kate-tools/build/client/loader.js",
    out: `packages/kate-tools/packaging/web/loader.js`,
    name: "Kate_single_loader",
  });
  copy("packages/kate-core/LICENCE.txt", `packages/kate-tools/packaging/web/KATE-LICENCE.txt`);
});

w.task("tools:clean", [], () => {
  clean_build("packages/kate-tools");
});

w.task("tools:make-npm-package", ["licences:generate", "tools:build"], () => {
  make_npm_package({
    source: "kate-tools",
    build: (b) => {
      b.copy_tree("assets");
      b.copy_tree("packaging");
      b.copy_tree("cli");
      b.copy_tree("build");
      b.glomp_deps("build");
    },
  });
});

// -- WWW
w.task("www:bundle", ["licences:generate", "core:build", "glomp:build"], () => {
  const date = new Date();
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  FS.writeFileSync("kate-buildinfo.json", JSON.stringify({ build: `r${yy}${mm}${dd}${hh}${mi}` }));
  glomp({
    entry: "packages/kate-core/build/index.js",
    out: `www/kate/kate-latest.js`,
    name: "Kate",
  });
  glomp({
    entry: "packages/kate-core/build/loader.js",
    out: `www/loader.js`,
    name: "Kate_webloader",
  });
  const version = require("./package.json").version;
  const worker0 = FS.readFileSync("packages/kate-core/build/worker.js", "utf-8");
  const worker = worker0.replace(/{{VERSION}}/, `${version}-r${yy}${mm}${dd}`);
  FS.writeFileSync("www/worker.js", worker);
  console.log("-> Wrote versioned www/worker.js");
  copy("packages/kate-core/RELEASE.txt", `www/kate/RELEASE-latest.txt`);
});

w.task("www:release", ["www:bundle", "www:generate-cache-manifest"], async () => {});

w.task("www:generate-cache-manifest", [], () => {
  const files0 = glob("**/*", { cwd: "www", nodir: true });
  const exclude = new Set(["worker.js", "versions.json", "_headers"]);
  const files = files0.filter((x) => !exclude.has(x)).map((x) => `/${x}`);
  FS.writeFileSync("www/cache-manifest.json", JSON.stringify(files, null, 2));
});

// -- Examples
w.task("example:hello-world", ["licences:generate", "tools:build"], () => {
  kart({
    config: "examples/hello-world/kate.json",
    output: kart_name("examples/hello-world", "hello-world"),
  });
});

w.task(
  "example:boon-scrolling",
  ["licences:generate", "tools:build", "domui:build", "glomp:build"],
  () => {
    tsc("examples/boon-scrolling");
    glomp({
      entry: "examples/boon-scrolling/build/index.js",
      out: "examples/boon-scrolling/www/game.js",
      name: "BoonScrolling",
    });
    kart({
      config: "examples/boon-scrolling/kate.json",
      output: kart_name("examples/boon-scrolling", "boon-scrolling"),
    });
  }
);

w.task("example:katchu", ["licences:generate", "tools:build", "glomp:build"], () => {
  tsc("examples/katchu");
  glomp({
    entry: "examples/katchu/build/index.js",
    out: "examples/katchu/www/katchu.js",
    name: "Katchu",
  });
  kart({
    config: "examples/katchu/kate.json",
    output: kart_name("examples/katchu", "katchu"),
  });
});

w.task(
  "example:all",
  ["example:hello-world", "example:boon-scrolling", "example:katchu"],
  () => {}
);

// -- Ecosystem
w.task("ecosystem:importer:build", [], () => {
  tsc("ecosystem/importer");
  remove("ecosystem/importer/www", { recursive: true, force: true });
  copy_tree("ecosystem/importer/assets", "ecosystem/importer/www");
  glomp({
    entry: "ecosystem/importer/build/index.js",
    out: "ecosystem/importer/www/js/importer.js",
    name: "KateImporter",
  });
  copy("packages/kate-appui/www/kate-appui.css", "ecosystem/importer/www/css/kate-appui.css");
});

w.task("ecosystem:importer:pack", ["ecosystem:publisher:build"], () => {
  kart({
    config: "ecosystem/importer/kate.json",
    output: kart_name("ecosystem/importer", "kate-importer"),
  });
});

w.task(
  "ecosystem:importer",
  [
    "licences:generate",
    "util:build",
    "tools:build",
    "appui:build",
    "glomp:build",
    "ecosystem:publisher:build",
  ],
  () => {}
);

w.task("ecosystem:publisher:build", [], () => {
  tsc("ecosystem/publisher");
  remove("ecosystem/publisher/www", { recursive: true, force: true });
  copy_tree("ecosystem/publisher/assets", "ecosystem/publisher/www");
  glomp({
    entry: "ecosystem/publisher/build/index.js",
    out: "ecosystem/publisher/www/js/publisher.js",
    name: "KatePublisher",
  });
  copy("packages/kate-appui/www/kate-appui.css", "ecosystem/publisher/www/css/kate-appui.css");
});

w.task("ecosystem:publisher:pack", ["ecosystem:publisher:build"], () => {
  kart({
    config: "ecosystem/publisher/kate.json",
    output: kart_name("ecosystem/publisher", "kate-publisher"),
  });
});

w.task(
  "ecosystem:publisher",
  [
    "licences:generate",
    "util:build",
    "tools:build",
    "appui:build",
    "glomp:build",
    "ecosystem:publisher:build",
  ],
  () => {}
);

w.task("ecosystem:all", ["ecosystem:importer", "ecosystem:publisher"], () => {});

// -- Desktop app
w.task("desktop:compile", [], () => {
  tsc("packages/kate-desktop");
});

w.task("desktop:clean", [], () => {
  clean_build("packages/kate-desktop");
});

w.task("desktop:generate", ["desktop:compile"], () => {
  remove("packages/kate-desktop/app", { recursive: true, force: true });
  copy_tree("packages/kate-desktop/build", "packages/kate-desktop/app");
  copy_tree("www", "packages/kate-desktop/app/www");
  glomp({
    entry: "packages/kate-core/build/index.js",
    out: "packages/kate-desktop/app/www/kate.js",
    name: "Kate",
  });
  glomp({
    entry: "packages/kate-desktop/build/client/loader.js",
    out: "packages/kate-desktop/app/www/loader.js",
    name: "Kate_desktop_loader",
  });
});

w.task("desktop:build", ["www:bundle", "desktop:generate"], () => {});

w.task("desktop:run", ["desktop:generate"], () => {
  const electron_path = Path.join("electron", electron_name());
  exec_file(electron_path, [Path.join(__dirname, "packages/kate-desktop")]);
});

// -- Workspace maintenance
w.task("chore:clean-tsc-cache", [], () => {
  const files = glob("**/tsconfig.tsbuildinfo", {
    absolute: true,
    cwd: __dirname,
  });
  for (const file of files) {
    if (!file.includes("node_modules")) {
      FS.rmSync(file);
    }
  }
});

w.task("chore:update-electron", [], async () => {
  console.log(`-> Updating checksums`);
  const checksums = await electron.fetch_checksum();
  FS.writeFileSync(Path.join(__dirname, "support/electron-shasum.txt"), checksums);
  exec_file(`node`, [
    `support/bootstrap.js`,
    `--npm-install`,
    `--download-electron`,
    `--unzip-electron`,
    `--build`,
  ]);
});

w.task("chore:clean-artifacts", [], () => {
  const packages = [
    "ecosystem/importer",
    "examples/boon-scrolling",
    "examples/hello-world",
    "examples/katchu",
    "packages/db-schema",
    "packages/glomp",
    "packages/kate-api",
    "packages/kate-appui",
    "packages/kate-bridges",
    "packages/kate-core",
    "packages/kate-desktop",
    "packages/kate-domui",
    "packages/kate-tools",
    "packages/ljt-vm",
    "packages/schema",
    "packages/util",
  ];

  for (const pkg of packages) {
    console.log(`-> Removing artifacts in ${pkg}`);
    clean_build(pkg);
  }
});

w.task("chore:update-versions", [], () => {
  const version = require("./package.json").version;
  for (const pkg of ["kate-tools", "kate-core", "kate-desktop"]) {
    for (const file of ["package.json", "electron-package.json"]) {
      if (!FS.existsSync(Path.join("packages", pkg, file))) {
        continue;
      }

      const json = JSON.parse(FS.readFileSync(Path.join("packages", pkg, file)));
      json.version = version;
      FS.writeFileSync(Path.join("packages", pkg, file), JSON.stringify(json, null, 2));
      console.log(`--> Updated ${pkg} to ${version}`);
    }
  }
});

// -- Documentation
w.task("docs:build", [], async () => {
  const suffix = process.platform === "win32" ? ".bat" : "";
  exec_file(`make${suffix}`, ["html"], {
    cwd: Path.join(__dirname, "docs"),
  });
});

w.task("docs:clean", [], async () => {
  const suffix = process.platform === "win32" ? ".bat" : "";
  exec_file(`make${suffix}`, ["clean"], {
    cwd: Path.join(__dirname, "docs"),
  });
});

w.task("docs:clean-build", ["docs:clean", "docs:build"], async () => {});

// -- Generating releases
w.task("release:win:x64", ["desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("win32", "x64");
});

w.task("release:win:x86", ["desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("win32", "ia32");
});

w.task("release:win:arm64", ["desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("win32", "arm64");
});

w.task("release:win:all", ["release:win:x64", "release:win:x86", "release:win:arm64"], () => {});

w.task("release:linux:x64", ["desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("linux", "x64");
});

w.task("release:linux:armv7l", ["desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("linux", "armv7l");
});

w.task("release:linux:arm64", ["desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("linux", "arm64");
});

w.task(
  "release:linux:all",
  ["release:linux:x64", "release:linux:armv7l", "release:linux:arm64"],
  () => {}
);

w.task("release:cartridges", ["example:all", "ecosystem:all"], () => {
  function copy_all(root) {
    const files = glob("**/*.kart", { cwd: root });
    for (const file of files) {
      const target = Path.join("dist/cartridges", root, Path.basename(file));
      FS.mkdirSync(Path.dirname(target), { recursive: true });
      copy(Path.join(root, file), target);
    }
  }

  // Copy all cartridges
  remove("dist/cartridges", { recursive: true, force: true });
  copy_all("examples");

  // Generate integrity hashes
  const files = glob("dist/cartridges/**/*.kart");
  const hashes = files.map((file) => {
    const buffer = FS.readFileSync(file);
    const hash = crypto.createHash("sha256").update(buffer).digest().toString("hex");
    return `${hash} ${file.replace(/^dist\/cartridges\//, "")}`;
  });
  FS.writeFileSync("dist/cartridges/SHASUM256.txt", hashes.join("\n") + "\n");
});

w.task("release:www", ["www:release", "release:cartridges", "tools:make-npm-package"], () => {
  const version = require("./package.json").version;
  if (!/^\d+\.\d+\.\d+(\-[\w\d]+)?$/.test(version)) {
    throw new Error(`invalid kate version: ${version}`);
  }
  copy_tree("www", "dist/www");
  exec(`zip -r ../kate-www-v${version}.zip *`, { cwd: "dist/www" });
  exec(`zip -r ../sample-cartridges-v${version}.zip *`, { cwd: "dist/cartridges" });
});

w.task("release:preview", ["www:release", "release:cartridges", "tools:make-npm-package"], () => {
  const version = require("./package.json").version;
  if (!/^\d+\.\d+\.\d+(\-[\w\d]+)?$/.test(version)) {
    throw new Error(`invalid kate version: ${version}`);
  }
  copy_tree("www", "dist/www");
  const index0 = FS.readFileSync("www/index.html", "utf-8");
  const index1 = index0.replace(/<title>Kate<\/title>/, "<title>Kate (Nightly)</title>");
  const index2 = index1.replace(/manifest\.json/, "nightly-manifest.json");
  FS.writeFileSync("dist/www/index.html", index2);
  exec(`zip -r ../kate-www-preview-v${version}.zip *`, { cwd: "dist/www" });
});

// -- Testing
w.task("test:setup-playwright", [], () => {
  playwright(["install", "--with-deps"]);
});

w.task("test:generate", ["util:build"], () => {
  glomp({
    entry: "packages/util/build/test-assert.js",
    out: "tests/unit/test-assert.js",
    name: "Assert",
  });
});

w.task("test:all", ["test:generate", "www:bundle"], () => {
  playwright(["test"]);
});

w.task("test:ci", ["test:setup-playwright", "test:generate"], () => {
  playwright(["test"]);
});

w.task("test:quick", [], () => {
  playwright(["test"]);
});

// -- Test server
w.task("server:start", [], () => {
  const express = require("express");
  const app = express();
  app.use("/", express.static(Path.join(__dirname, "www")));
  app.listen(3000, "127.0.0.1", () => {
    console.log("Server started at http://localhost:3000");
  });
});

// -- Multi-project convenience
w.task("dependencies", ["tools:dependencies"], () => {});

w.task(
  "all",
  [
    "glomp:build",
    "util:build",
    "ljt:build",
    "schema:build",
    "db-schema:build",
    "api:build",
    "bridges:build",
    "core:build",
    "domui:build",
    "appui:build",
    "tools:build",
    "www:bundle",
    "example:all",
    "ecosystem:all",
    "desktop:build",
  ],
  () => {}
);

// -- Main
w.task("help", [], () => {
  console.log(`Available tasks:\n`);
  for (const task of w.all_tasks) {
    console.log("-", (task.name + " ").padEnd(25, "."), task.documentation);
  }
  console.log("");
}).with_doc("Shows usage help");

const [task_name] = process.argv.slice(2);
const task = w.find(task_name);
if (!task) {
  throw new Error(`Undefined task ${task_name}. See "make.js help" for available tasks.`);
}

assert_root("make");
w.run(task_name).catch((error) => {
  console.log("---\nTask execution failed.");
  console.error(error.stack);
  process.exit(1);
});
