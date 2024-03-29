/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { kernel, os } from "../../../kate-core";
import type { KateNative as NativeAPI } from "../native-api";

declare var Kate: {
  kernel: typeof kernel;
  os: typeof os;
};

declare var KateNative: typeof NativeAPI;

document.body.classList.add("kate-native");

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

async function main() {
  const is_fullscreen = await KateNative.is_fullscreen();
  const case_mode = is_fullscreen
    ? {
        type: "fullscreen" as const,
        resolution: await KateNative.screen_resolution(),
        scale_to_fit: true,
      }
    : undefined;
  await load_script("kate.js");

  const kate = Kate.kernel.KateKernel.from_root(document.querySelector(".kate-case")!, {
    mode: "native",
    persistent_storage: true,
    case: case_mode,
  });
  const kate_os = await Kate.os.KateOS.boot(kate, {
    set_case_mode: case_mode == null,
  });
  if (case_mode != null) {
    kate.console.case.reconfigure(case_mode);
  }
}

main();
