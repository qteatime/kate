/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
