import * as Path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
import * as SystemInformation from "./system-information";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1316,
    height: 600,
    frame: false,
    transparent: true,
    icon: Path.join(__dirname, "icons/icon256.png"),
    webPreferences: {
      preload: Path.join(__dirname, "native-api.js"),
    },
  });

  win.loadFile(Path.join(__dirname, "www/index.html"));
};

ipcMain.handle("kate:get-system-info", async (_ev) => {
  const info = await SystemInformation.get_system_info();
  return info;
});

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
