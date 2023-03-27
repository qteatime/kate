#!/usr/bin/env node
const execFile = require("child_process").execFileSync;
const Path = require("path");
const Electron = require("electron");

execFile(Electron, [Path.join(__dirname, "..")], {
  stdio: ["inherit", "inherit", "inherit"],
});
