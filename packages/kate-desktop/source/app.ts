import * as Path from "path";
import { app, BrowserWindow } from "electron";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1316,
    height: 600,
    frame: false,
    transparent: true,
    icon: Path.join(__dirname, "icons/icon256.png"),
  });

  win.loadFile(Path.join(__dirname, "index.html"));
};

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
