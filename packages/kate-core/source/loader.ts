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

async function load_script(url: string) {
  return new Promise<void>((resolve, reject) => {
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

async function load_kate() {
  try {
    await load_script("kate/kate-latest.js");
  } catch (e) {
    alert(`Kate could not be loaded.`);
    return;
  }
}

async function main() {
  await load_kate();
  await navigator.serviceWorker?.register(`worker.js`).catch((e) => {
    console.error("[Kate] failed to register Kate worker", e);
    return null;
  });

  if ("virtualKeyboard" in navigator && navigator.virtualKeyboard != null) {
    navigator.virtualKeyboard.overlaysContent = true;
  }

  // Run Kate
  const kate = Kate.kernel.KateKernel.from_root(document.querySelector(".kate-case")!, {
    mode: "web",
    persistent_storage: true,
  });
  const kate_os = await Kate.os.KateOS.boot(kate);
  (window as any).kate = kate;
  (window as any).kate_os = kate_os;
}

main();
