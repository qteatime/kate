#!/usr/bin/env node
const execSync = require("child_process").execSync;
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

const w = new World();

w.task("generate:bridges", [], () => {
  const files = glob("source/kate-bridges/*.js", {absolute: true}).filter(x => !x.endsWith("/index.js"));
  const data = Object.fromEntries(files.map(x => [Path.basename(x), FS.readFileSync(x, "utf-8")]));
  const content = `export const bridges = ${JSON.stringify(data, null, 2)};`;
  FS.writeFileSync("source/kate-bridges/index.ts", content);
}).with_doc("Generates TS definitions for all bridges.");

w.task("generate:schemas", [], () => {
  exec("npm run gen-kart");
}).with_doc("Generates TS definitions for binary schemas.");

w.task("compile:ts", ["generate:bridges", "generate:schemas"], () => {
  exec("npm run build-ts");
}).with_doc("Compiles Kate's source files");

w.task("bundle:os", ["compile:ts"], () => {
  exec("npm run bundle-os");
}).with_doc("Generates JS bundles for Kate's OS.");

w.task("bundle:vm", ["compile:ts"], () => {
  exec("npm run bundle");
}).with_doc("Generates JS bundles for Kate's core VM.");

w.task("bundle", ["bundle:os", "bundle:vm"], () => {})
 .with_doc("Generates JS bundles for all Kate's parts.");

w.task("build", ["bundle"], () => {})
 .with_doc("Builds a fully-functioning Kate console.");

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
