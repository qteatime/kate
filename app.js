"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const createWindow = () => {
    const win = new electron_1.BrowserWindow({
        width: 1310,
        height: 600,
        frame: false,
        transparent: true
    });
    win.loadFile("index.html");
};
electron_1.app.whenReady().then(() => {
    createWindow();
});
electron_1.app.on("window-all-closed", () => {
    electron_1.app.quit();
});
