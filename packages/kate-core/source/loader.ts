/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
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
