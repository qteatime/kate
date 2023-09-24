/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { app } from "electron";
import * as OS from "os";

export type SystemInfo = Awaited<ReturnType<typeof get_system_info>>;

export async function get_system_info() {
  const memory = process.getSystemMemoryInfo();
  const cpus = OS.cpus();

  return {
    app: {
      wrapper: "Electron",
      version: app.getVersion(),
    },
    engine: [
      { name: "Chromium", version: process.versions.chrome },
      { name: "Electron", version: process.versions.electron },
    ],
    memory: {
      total: memory.total,
      free: memory.free,
    },
    os: {
      name: OS.type(),
      platform: OS.platform(),
      version: OS.release(),
      extended_version: OS.version(),
      arm64_translation: app.runningUnderARM64Translation,
      architecture: OS.arch(),
    },
    cpu: {
      logical_cores: cpus.length,
      model: cpus[0].model,
      speed: cpus[0].speed,
      endianness: OS.endianness(),
    },
  };
}
