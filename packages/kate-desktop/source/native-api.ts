import { contextBridge, ipcRenderer } from "electron";
import type { SystemInfo } from "./system-information";

export const KateNative = {
  is_native: true,

  async get_system_information(): Promise<SystemInfo> {
    return await ipcRenderer.invoke("kate:get-system-info");
  },

  async resize(size: { width: number; height: number }): Promise<void> {
    if (
      !isFinite(size.width) ||
      !isFinite(size.height) ||
      size.width < 1 ||
      size.height < 1
    ) {
      throw new Error(`Invalid size.`);
    }

    await ipcRenderer.invoke("kate:resize", {
      width: Number(size.width),
      height: Number(size.height),
    });
  },
};

contextBridge.exposeInMainWorld("KateNative", KateNative);
