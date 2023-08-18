void function([module, exports, node_require]) {
  const require = (id) => {
    if (typeof id === "string") {
      return node_require(id);
    }

    const module = require.mapping.get(id);
    if (module == null) {
      throw new Error("Undefined module " + id);
    }
    if (!module.initialised) {
      module.initialised = true;
      module.load.call(null,
        module.module,
        module.module.exports,
        module.dirname,
        module.filename
      );
    }
    return module.module.exports;
  };
  
  require.mapping = new Map();
  require.define = (id, dirname, filename, fn) => {
    const module = Object.create(null);
    module.exports = Object.create(null);
    require.mapping.set(id, {
      module: module,
      dirname,
      filename,
      initialised: false,
      load: fn
    });
  };

// packages\kate-core\build\loader.js
require.define(1, "packages\\kate-core\\build", "packages\\kate-core\\build\\loader.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (!("KateNative" in window)) {
    window.KateNative = null;
}
const url_args = new URL(location.href).searchParams;
const DEFAULT_CHANNEL = url_args.get("channel") ??
    (location.hostname === "kate.qteati.me" ? "preview" : "latest");
if (url_args.get("reset") === "erase-all-data") {
    if (window.confirm("Erase all data in Kate and restore it to factory defaults?")) {
        localStorage["kate-channel"] = "";
        localStorage["kate-version"] = "null";
        indexedDB.deleteDatabase("kate");
    }
}
async function load_script(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.onload = () => resolve();
        script.onerror = (ev, source, lineno, colno, error) => {
            console.error(`[Kate] failed to load script at ${url}`, ev, source, lineno, colno, error);
            reject(new Error(`failed to load script at ${url}`));
        };
        script.src = url;
        document.body.appendChild(script);
    });
}
async function load_kate(version) {
    try {
        await load_script(version.main);
    }
    catch (e) {
        alert(`Kate version ${version.version} could not be found.`);
        return;
    }
}
async function main() {
    let version = JSON.parse(localStorage["kate-version"] ?? "null");
    const channel = localStorage["kate-channel"] || DEFAULT_CHANNEL;
    if (version == null) {
        const versions = (await fetch("versions.json").then((x) => x.json()));
        const latest = versions.channels[channel];
        version = versions.versions.find((x) => x.version === latest) ?? null;
        if (version == null) {
            alert("Could not find a Kate version to download.");
            return;
        }
        localStorage["kate-version"] = JSON.stringify(version);
        localStorage["kate-channel"] = channel;
        await load_kate(version);
    }
    else {
        await load_kate(version);
    }
    await navigator.serviceWorker?.register(`worker.js`).catch((e) => {
        console.error("[Kate] failed to register Kate worker", e);
        return null;
    });
    // Run Kate
    const kate = Kate.kernel.KateKernel.from_root(document.querySelector(".kate"), {
        mode: "web",
        persistent_storage: true,
    });
    const kate_os = await Kate.os.KateOS.boot(kate);
    window.kate = kate;
    window.kate_os = kate_os;
}
main();

});

module.exports = require(1);
}((() => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    return [module, module.exports, require];
  } else if (typeof window !== "undefined") {
    const module = Object.create(null);
    module.exports = Object.create(null);
    Object.defineProperty(window, "Kate_webloader", {
      get() { return module.exports },
      set(v) { module.exports = v }
    });
    return [module, module.exports, (id) => {
      throw new Error("Cannot load " + JSON.stringify(id) + " because node modules are not supported.");
    }];
  } else {
    throw new Error("Unsupported environment");
  }
})());