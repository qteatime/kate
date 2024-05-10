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
