#!/usr/bin/env node
const execSync = require("child_process").execSync;
const execFile = require("child_process").execFileSync;
const OS = require("os");
const Path = require("path");
const FS = require("fs");
const glob = require("glob").sync;

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

function tsc(project) {
  const file = Path.join(__dirname, "node_modules/typescript/bin/tsc");
  exec_file("node", [file, "-p", project]);
}

function tsc_file(source, target) {
  const file = Path.join(__dirname, "node_modules/typescript/bin/tsc");
  exec_file("node", [file, "--declaration", "--outDir", target, source]);
}

function ljtc(file, target) {
  const cmd = OS.platform() === "win32" ? "crochet.cmd" : "crochet";
  const result = exec_file_capture(cmd, ["ljtc", "--", "ts", file]);
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

function kart({ config, output }) {
  exec_file("node", [
    "packages/kate-tools/cli/kart.js",
    "--output",
    output,
    config,
  ]);
}

function copy(from, to) {
  console.log("-> Copy", from, "->", to);
  FS.mkdirSync(Path.dirname(to), { recursive: true });
  FS.copyFileSync(from, to);
}

function copy_tree(from, to) {
  console.log("-> Copy tree", from, "->", to);

  const go = (src, dst) => {
    const stat = FS.statSync(src);
    if (stat.isFile()) {
      copy(src, dst);
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
w.task("glomp:compile", [], () => {
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

// -- Schema
w.task("schema:generate", [], () => {
  ljtc(
    "packages/schema/cartridge.ljt",
    "packages/schema/generated/cartridge.ts"
  );
});

w.task("schema:compile", [], () => {
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
  ["schema:build", "bridges:build", "util:build", "db-schema:build"],
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
w.task("tools:compile", ["schema:build"], () => {
  tsc("packages/kate-tools");
});

w.task("tools:build", ["tools:compile", "www:bundle"], () => {
  remove("packages/kate-tools/packaging/web", { recursive: true, force: true });
  copy_tree("www", "packages/kate-tools/packaging/web");
  glomp({
    entry: "packages/kate-core/build/index.js",
    out: `packages/kate-tools/packaging/web/kate.js`,
    name: "Kate",
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
  const version = require("./package.json").version;
  if (!/^[0-9a-z\.\-]+$/.test(version)) {
    throw new Error(`FATAL: package.json version is malformed`);
  }
  glomp({
    entry: "packages/kate-core/build/index.js",
    out: `www/kate/kate-${version}.js`,
    name: "Kate",
  });
  copy("packages/kate-core/RELEASE.txt", `www/kate/RELEASE-${version}.txt`);
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
  copy(
    "packages/kate-desktop/assets/loader.js",
    "packages/kate-desktop/app/www/loader.js"
  );
});

w.task("desktop:build", ["www:bundle", "desktop:generate"], () => {});

w.task("desktop:run", ["desktop:generate"], () => {
  const Electron = require("electron");
  exec_file(Electron, [Path.join(__dirname, "packages/kate-desktop")]);
});

w.task("desktop:make-npm-package", ["desktop:clean", "desktop:build"], () => {
  make_npm_package({
    source: "kate-desktop",
    build: (b) => {
      b.copy_tree("app");
      b.copy_tree("bin");
      copy("README.md", Path.join(b.to, "README.md"));
    },
  });
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

// -- Multi-project convenience
w.task(
  "all",
  [
    "glomp:build",
    "util:build",
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

w.run(task_name).catch((error) => {
  console.log("---\nTask execution failed.");
  console.error(error.stack);
  process.exit(1);
});
