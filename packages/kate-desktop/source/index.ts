/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Path from "path";
import { parseArgs } from "util";
import { app, BrowserWindow, ipcMain } from "electron";
import * as SystemInformation from "./system-information";

const args = parseArgs({
  options: {
    fullscreen: { type: "boolean", default: false },
    resolution: { type: "string", default: "720" },
  },
});

const is_fullscreen = args.values.fullscreen ?? false;
const resolution = ["480", "720"].includes(args.values.resolution ?? "720")
  ? Number(args.values.resolution ?? "720")
  : 720;

const createWindow = (fullscreen: boolean) => {
  const win = new BrowserWindow({
    width: 1316,
    height: 600,
    minWidth: 884,
    minHeight: 574,
    resizable: fullscreen,
    fullscreen: fullscreen,
    frame: false,
    transparent: !fullscreen,
    icon: Path.join(__dirname, "icons/icon256.png"),
    webPreferences: {
      preload: Path.join(__dirname, "native-api.js"),
    },
  });

  win.loadFile(Path.join(__dirname, "www/index.html"));
  return win;
};

app.whenReady().then(() => {
  const win = createWindow(is_fullscreen);

  ipcMain.handle("kate:get-system-info", async (_ev) => {
    const info = await SystemInformation.get_system_info();
    return info;
  });

  ipcMain.handle(
    "kate:resize",
    async (_ev, { width, height }: { width: number; height: number }) => {
      const w = Math.max(884, width);
      const h = Math.max(574, height);
      win.setContentSize(w, h);
      win.center();
    }
  );

  ipcMain.handle("kate:is-fullscreen", async (_ev) => {
    return is_fullscreen;
  });

  ipcMain.handle("kate:screen-resolution", async (_ev) => {
    return resolution;
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
