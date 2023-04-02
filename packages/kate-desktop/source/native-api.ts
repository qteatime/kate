import { contextBridge, ipcRenderer } from "electron";
import type { SystemInfo } from "./system-information";

export const KateNative = {
  is_native: true,

  async get_system_information(): Promise<SystemInfo> {
    return await ipcRenderer.invoke("kate:get-system-info");
  },
};

contextBridge.exposeInMainWorld("KateNative", KateNative);
