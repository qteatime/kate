/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { kernel, os } from "./index";
declare var Kate: {
  kernel: typeof kernel;
  os: typeof os;
};

if (!("KateNative" in window)) {
  (window as any).KateNative = null;
}

const url_args = new URL(location.href).searchParams;

const DEFAULT_CHANNEL =
  url_args.get("channel") ??
  (location.hostname === "kate.qteati.me" ? "preview" : "latest");

if (url_args.get("reset") === "erase-all-data") {
  if (
    window.confirm("Erase all data in Kate and restore it to factory defaults?")
  ) {
    localStorage["kate-channel"] = "";
    localStorage["kate-version"] = "null";
    indexedDB.deleteDatabase("kate");
  }
}

type Version = {
  version: string;
  main: string;
  breaking_change: boolean;
  migration_needed: boolean;
  channels: string[];
  release_notes: string;
};

type VersionMeta = {
  versions: Version[];
  channels: { [key: string]: string };
};

async function load_script(url: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.onload = () => resolve();
    script.onerror = (ev, source, lineno, colno, error) => {
      console.error(
        `[Kate] failed to load script at ${url}`,
        ev,
        source,
        lineno,
        colno,
        error
      );
      reject(new Error(`failed to load script at ${url}`));
    };
    script.src = url;
    document.body.appendChild(script);
  });
}

async function load_kate(version: Version) {
  try {
    await load_script(version.main);
  } catch (e) {
    alert(`Kate version ${version.version} could not be found.`);
    return;
  }
}

async function main() {
  let version: Version | null = JSON.parse(
    localStorage["kate-version"] ?? "null"
  );
  const channel: string = localStorage["kate-channel"] || DEFAULT_CHANNEL;
  if (version == null) {
    const versions = (await fetch("versions.json").then((x) =>
      x.json()
    )) as VersionMeta;
    const latest = versions.channels[channel];
    version = versions.versions.find((x) => x.version === latest) ?? null;
    if (version == null) {
      alert("Could not find a Kate version to download.");
      return;
    }
    localStorage["kate-version"] = JSON.stringify(version);
    localStorage["kate-channel"] = channel;
    await load_kate(version);
  } else {
    await load_kate(version);
  }

  await navigator.serviceWorker?.register(`worker.js`).catch((e) => {
    console.error("[Kate] failed to register Kate worker", e);
    return null;
  });

  // Run Kate
  const kate = Kate.kernel.KateKernel.from_root(
    document.querySelector(".kate")!,
    {
      mode: "web",
      persistent_storage: true,
    }
  );
  const kate_os = await Kate.os.KateOS.boot(kate);
  (window as any).kate = kate;
  (window as any).kate_os = kate_os;
}

main();
