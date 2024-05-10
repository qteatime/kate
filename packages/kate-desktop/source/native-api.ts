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

import { contextBridge, ipcRenderer } from "electron";
import type { SystemInfo } from "./system-information";

export const KateNative = {
  is_native: true,

  async get_system_information(): Promise<SystemInfo> {
    return await ipcRenderer.invoke("kate:get-system-info");
  },

  async resize(size: { width: number; height: number }): Promise<void> {
    if (
      typeof size.width !== "number" ||
      typeof size.height !== "number" ||
      !isFinite(size.width) ||
      !isFinite(size.height) ||
      size.width < 1 ||
      size.height < 1
    ) {
      throw new Error(`Invalid size.`);
    }

    await ipcRenderer.invoke("kate:resize", {
      width: size.width,
      height: size.height,
    });
  },

  async is_fullscreen(): Promise<boolean> {
    return ipcRenderer.invoke("kate:is-fullscreen");
  },

  async screen_resolution(): Promise<480 | 720 | 960> {
    return ipcRenderer.invoke("kate:screen-resolution");
  },
};

contextBridge.exposeInMainWorld("KateNative", KateNative);
