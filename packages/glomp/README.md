# Glomp

Glomp is a very straight-forward packaging tool for JavaScript projects. It does not (and will not ever) support plugins, semantics are fixed and minimal so that it can be realistically audited by other humans _and_ used in the compilation toolchain for a trusted, security-oriented platform.

Glomp supports:

- Resolving modules using Node algorithm (node_modules resolution is not currently supported, however);

- Static require() calls to JavaScript and JSON files.

Glomp does not support:

- AMD or any module system different from Node's built-in one. Browser packages are expected to rely on an exported global name.

## Usage

With the CLI tool:

```shell
$ glomp my-file.js --out my-bundle.js --name MyBundle
```

With the Node module:

```js
const FS = require("fs");
const { pack } = require("@qteatime/glomp");
const root_dir = process.cwd();
// 'root_dir' is used as the root directory for resolving filenames,
// and affects only the '__dirname' and '__filename' magic variables on
// compiled modules.
const code = pack(FS.readFileSync("my-file.js"), root_dir, "MyBundle");
FS.writeFileSync("my-bundle.js", code);
```

This will generate a bundle that can be require'd on either browsers or Node.

## Known issues

Glomp currently transforms JavaScript using regular expressions. This is reasonable if all your files are trusted and you're not including any third-party code (which _is_ the case for Kate). You should not use it if your dependency graph includes code that wasn't written by you until Glomp adds a proper JavaScript parser.

## Licence

Glomp is (c) Q. and released under the MIT license.
