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

  async toggle_fullscreen(value: boolean): Promise<void> {
    if (typeof value !== "boolean") {
      throw new Error(`invalid flag`);
    }
    await ipcRenderer.invoke("kate:toggle-fullscreen", value);
  },
};

contextBridge.exposeInMainWorld("KateNative", KateNative);
