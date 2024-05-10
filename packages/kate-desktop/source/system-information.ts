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
