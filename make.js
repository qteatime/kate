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

function browserify(args) {
  const file = Path.join(__dirname, "node_modules/browserify/bin/cmd.js");
  exec_file("node", [file, ...args]);
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
  exec_file("node", ["packages/kate-packaging/build/kart.js", output, config]);
}

const w = new World();

// -- Util
w.task("util:compile", [], () => {
  tsc("packages/util");
});

w.task("util:build", ["util:compile"], () => {});

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

w.task("briges:generate", ["bridges:compile"], () => {
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
  ["schema:build", "util:build", "db-schema:build"],
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

// -- Packaging
w.task("packaging:compile", ["schema:build"], () => {
  tsc("packages/kate-packaging");
});

w.task("packaging:build", ["packaging:compile"], () => {});

// -- WWW
w.task("www:bundle", ["core:build"], () => {
  browserify([
    "-e",
    "packages/kate-core/build/index.js",
    "-o",
    "www/kate.js",
    "-s",
    "Kate",
  ]);
});

// -- Examples
w.task("example:hello-world", ["packaging:build"], () => {
  kart({
    config: "examples/hello-world/kate.json",
    output: "examples/hello-world/hello.kart",
  });
});

w.task("example:boon-scrolling", ["packaging:build", "domui:build"], () => {
  tsc("examples/boon-scrolling");
  browserify([
    "-e",
    "examples/boon-scrolling/build/index.js",
    "-o",
    "examples/boon-scrolling/www/game.js",
  ]);
  kart({
    config: "examples/boon-scrolling/kate.json",
    output: "examples/boon-scrolling/boon-scrolling.kart",
  });
});

w.task(
  "example:all",
  ["example:hello-world", "example:boon-scrolling"],
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
