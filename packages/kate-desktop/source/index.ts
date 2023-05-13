import * as Path from "path";
import { parseArgs } from "util";
import { app, BrowserWindow, ipcMain } from "electron";
import * as SystemInformation from "./system-information";

const args = parseArgs({
  options: { fullscreen: { type: "boolean", default: false } },
});

const createWindow = (fullscreen: boolean) => {
  const win = new BrowserWindow({
    width: 1316,
    height: 600,
    minWidth: 884,
    minHeight: 574,
    resizable: false,
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
  const win = createWindow(args.values.fullscreen ?? false);

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

  ipcMain.handle("kate:toggle-fullscreen", async (_ev, flag: boolean) => {
    win.setResizable(flag);
    if (flag) {
      win.maximize();
    } else {
      win.unmaximize();
      win.center();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
