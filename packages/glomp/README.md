# Glomp

Glomp is an opinionated packaging tool for JavaScript and CSS. It does not
support plugins, which means that all of its semantics are fixed and minimal
enough to be realistically audited by reading the source code _and_ used in
the compilation toolchain for trusted, security-oriented platforms.

## Semantic support

Glomp supports:

- Resolving JS modules using Node's module resolution algorithm **for relative paths**.

- Static `require()` calls to JavaScript, JSON, and CSS files.

- Inlining CSS imports and embedding binary files as `data-uri` in CSS `url()` references.

Glomp does not support:

- Resolving references to node_modules packages. This restriction might be lifted in the future, but for now Glomp leaves them as-is in the code and lets Node.js do the resolution at runtime. Browsers will throw an error at runtime for these references, if they're evaluated.

- AMD or any module system different from Node's built-in one. Browser packages are expected to rely on an exported global name.

- Sourcemaps;

- Automatic polyfilling or magic requires, which may load unaudited modules;

- Plugins or any other form of user extension of its semantics, as we can't prove those are sensible with the rest of the compiler — you should not be putting unaudited packages anywhere near trusted/secure packages anyway;

- Native ECMAScript modules (Glomp works with CommonJS);

- Dead code elimination, traced as in tree-shaking or not;

- Hot-patching, incremental builds, and other developer niceties. While they aren't impossible to secure, they increase the code size considerably and make it harder to audit or reason about the compilation pipeline. Use glomp to generate production builds only.

- Minification. Kate and Crochet do not need to worry about module sizes as they're aimed at offline use cases, and minification requires a substantially more complex compiler.

## Usage

With the CLI tool:

```shell
$ glomp my-file.js --out my-bundle.js --name MyBundle
```

Or:

```shell
$ glomp my-file.css --out my-bundle.css
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
Or, in the case of CSS bundles, just loaded as a regular CSS file (assets
required by the CSS will be inlined).

## Known issues

Glomp currently transforms JavaScript and CSS using regular expressions. This is reasonable if all your files are trusted and you're not including any third-party code (which _is_ the case for Kate). You should not use it if your dependency graph includes code that wasn't written by you until Glomp adds a proper JavaScript parser.

## Licence

Glomp is (c) Niini and released under the Mozilla Public License v2.0.
See `LICENCE` for details.
