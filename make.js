#!/usr/bin/env node
const execSync = require("child_process").execSync;
const execFile = require("child_process").execFileSync;
const OS = require("os");
const Path = require("path");
const FS = require("fs");
const glob = require("glob").sync;
const { copy, copy_tree, assert_root, zip } = require("./support/utils");
const gen_build = require("./support/generate-builds");

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
  const code = pack(entry, __dirname, name);
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
  exec_file("node", [
    "packages/kate-tools/cli/kart.js",
    "--output",
    output,
    config,
  ]);
}

function clean_build(root) {
  remove(Path.join(root, "build"), { recursive: true, force: true });
  remove(Path.join(root, "tsconfig.tsbuildinfo"), { force: true });
}

function remove(
  path,
  { recursive, force } = { recursive: false, force: false }
) {
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
  copy("LICENCE", Path.join(to, "LICENCE"));
  build({ from, to, copy: cp, maybe_copy: mcp, copy_tree: ct, glomp_deps });
  console.log("--> Dry-running npm-pack for", source);
  exec("npm pack --dry-run", { cwd: to });
}

const w = new World();

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

w.task("glomp:make-npm-package", ["glomp:clean", "glomp:build"], () => {
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
  ljtc(
    "json",
    "packages/schema/cartridge.ljt",
    "packages/schema/generated/cartridge.json"
  );
  ljtc(
    "ts-types",
    "packages/schema/cartridge.ljt",
    "packages/schema/generated/cartridge-schema.ts"
  );
});

w.task("schema:compile", ["ljt:build"], () => {
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
  tsc_file(
    "packages/kate-bridges/source/index.ts",
    "packages/kate-bridges/build"
  );
});

w.task("bridges:build", ["bridges:generate"], () => {});

// -- Core
w.task(
  "core:compile",
  [
    "schema:build",
    "bridges:build",
    "util:build",
    "db-schema:build",
    "ljt:build",
  ],
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

// -- Kate ADV
w.task("adv:compile", ["domui:build"], () => {
  tsc("packages/kate-adv");
});

w.task("adv:build", ["adv:compile"], () => {});

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
  copy(
    "packages/kate-core/LICENCES.txt",
    `packages/kate-tools/packaging/web/KATE-LICENCES.txt`
  );
});

w.task("tools:clean", [], () => {
  clean_build("packages/kate-tools");
});

w.task("tools:make-npm-package", ["tools:clean", "tools:build"], () => {
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
w.task("www:bundle", ["core:build", "glomp:build"], () => {
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
  copy("packages/kate-core/build/worker.js", "www/worker.js");
  copy("packages/kate-core/RELEASE.txt", `www/kate/RELEASE-latest.txt`);
});

w.task("www:release", ["www:bundle"], () => {
  const version = require("./package.json").version;
  if (!/^[0-9a-z\.\-]+$/.test(version)) {
    throw new Error(`FATAL: package.json version is malformed`);
  }
  copy("www/kate/kate-latest.js", `www/kate/kate-${version}.js`);
  copy("www/kate/RELEASE-latest.txt", `www/kate/RELEASE-${version}.txt`);
});

// -- Examples
w.task("example:hello-world", ["tools:build"], () => {
  kart({
    config: "examples/hello-world/kate.json",
    output: "examples/hello-world/hello.kart",
  });
});

w.task(
  "example:boon-scrolling",
  ["tools:build", "domui:build", "glomp:build"],
  () => {
    tsc("examples/boon-scrolling");
    glomp({
      entry: "examples/boon-scrolling/build/index.js",
      out: "examples/boon-scrolling/www/game.js",
      name: "BoonScrolling",
    });
    kart({
      config: "examples/boon-scrolling/kate.json",
      output: "examples/boon-scrolling/boon-scrolling.kart",
    });
  }
);

w.task("example:katchu", ["tools:build", "glomp:build"], () => {
  tsc("examples/katchu");
  glomp({
    entry: "examples/katchu/build/index.js",
    out: "examples/katchu/www/katchu.js",
    name: "Katchu",
  });
  kart({
    config: "examples/katchu/kate.json",
    output: "examples/katchu/katchu.kart",
  });
});

w.task(
  "example:all",
  ["example:hello-world", "example:boon-scrolling", "example:katchu"],
  () => {}
);

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
      FS.rm(file);
    }
  }
});

w.task("chore:update-versions", [], () => {
  const version = require("./package.json").version;
  for (const pkg of ["kate-tools", "kate-core", "kate-desktop"]) {
    const json = JSON.parse(
      FS.readFileSync(Path.join("packages", pkg, "package.json"))
    );
    json.version = version;
    FS.writeFileSync(
      Path.join("packages", pkg, "package.json"),
      JSON.stringify(json, null, 2)
    );
    console.log(`--> Updated ${pkg} to ${version}`);
  }
});

// -- Generating releases
w.task("release:win:x64", ["desktop:clean", "desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("win32", "x64");
});

w.task("release:win:x86", ["desktop:clean", "desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("win32", "ia32");
});

w.task("release:win:arm64", ["desktop:clean", "desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("win32", "arm64");
});

w.task(
  "release:win:all",
  ["release:win:x64", "release:win:x86", "release:win:arm64"],
  () => {}
);

w.task("release:linux:x64", ["desktop:clean", "desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("linux", "x64");
});

w.task("release:linux:armv7l", ["desktop:clean", "desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("linux", "armv7l");
});

w.task("release:linux:arm64", ["desktop:clean", "desktop:build"], async () => {
  await gen_build.gen_unsigned_zip("linux", "arm64");
});

w.task(
  "release:linux:all",
  ["release:linux:x64", "release:linux:armv7l", "release:linux:arm64"],
  () => {}
);

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
    "adv:build",
    "tools:build",
    "www:bundle",
    "example:all",
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
  throw new Error(
    `Undefined task ${task_name}. See "make.js help" for available tasks.`
  );
}

assert_root("make");
w.run(task_name).catch((error) => {
  console.log("---\nTask execution failed.");
  console.error(error.stack);
  process.exit(1);
});
