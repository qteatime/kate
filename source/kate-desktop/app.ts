import * as Path from "path";
import {app, BrowserWindow} from "electron";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1310,
    height: 600,
    frame: false,
    transparent: true
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
})

app.on("window-all-closed", () => {
  app.quit();
})

