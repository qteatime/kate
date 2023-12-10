/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as FS from "fs";
import * as Path from "path";
import { parseArgs } from "util";
import * as NodeUrl from "url";
import { app, BrowserWindow, ipcMain, session, protocol, net } from "electron";
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

  win.loadURL("kate://app/index.html");
  return win;
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: "kate",
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

function mime(x: string) {
  switch (Path.extname(x)) {
    case ".js":
      return "application/javascript";
    case ".json":
      return "application/json";
    case ".css":
      return "text/css";
    case ".png":
      return "image/png";
    case ".wav":
      return "audio/wav";
    case ".svg":
      return "image/svg";
    case ".ttf":
      return "font/ttf";
    case ".html":
      return "text/html";
    default:
      return "application/octet-stream";
  }
}

app.whenReady().then(() => {
  const root = Path.resolve(__dirname, "www");
  session.defaultSession.protocol.handle("kate", async (request) => {
    const url = new URL(request.url);
    switch (url.host) {
      case "app": {
        const pathname = url.pathname.replace(/^\//, "");
        const path = Path.resolve(root, pathname);
        const real_file = FS.realpathSync(path);
        if (!real_file.startsWith(root)) {
          return new Response(null, { status: 403 });
        }

        const file = NodeUrl.pathToFileURL(real_file);
        const response = await net.fetch(file.toString());
        return new Response(response.body, {
          headers: {
            "Content-Type": mime(pathname),
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Content-Security-Policy":
              "default-src blob: data: 'self' 'unsafe-eval' 'unsafe-inline', object-src 'none', navigate-to 'self'",
            "Permissions-Policy":
              "document-domain=(), camera=(), display-capture=(), geolocation=(), local-fonts=(), microphone=(), midi=(), payment=(), serial=(), usb=()",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "no-referrer",
          },
          status: response.status,
          statusText: response.statusText,
        });
      }

      default:
        return new Response(null, { status: 403 });
    }
  });

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
