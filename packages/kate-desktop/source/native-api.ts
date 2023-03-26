import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("KateNative", {
  is_native: true,
});
