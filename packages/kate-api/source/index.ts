/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { KateBrowser } from "./browser";
import { KateCapture } from "./capture";
import { KateCartFS } from "./cart-fs";
import { KateCartManager } from "./cart-manager";
import { KateIPC } from "./channel";
import { DeveloperProfile, KateDeveloper } from "./developer";
import { DeviceFileHandle, KateDeviceFileAccess } from "./device-file";
import { KateDialogs } from "./dialog";
import { FileBucket, KateFile, KateFileStore } from "./file-store";
import { InputKey, KateInput } from "./input";
import { KateObjectStore, ObjectMetadata, Object, Usage } from "./object-store";
import { KatePointerInput, PointerClick, PointerLocation } from "./pointer-input";
import { KateTimer } from "./timer";
import { serialise } from "./util";

declare var KATE_SECRET: string;

const channel = new KateIPC(KATE_SECRET, window.parent);
channel.setup();

export const events = channel.events;

export const cart_fs = new KateCartFS(channel);

export const store = new KateObjectStore(channel);

export const file_store = new KateFileStore(channel);

export const timer = new KateTimer();
timer.setup();

export const input = new KateInput(channel, timer);
input.setup();

export const pointer_input = new KatePointerInput(timer);

export const capture = new KateCapture(channel, input);
capture.setup();

export const browser = new KateBrowser(channel);

export const device_files = new KateDeviceFileAccess(channel);

export const cart_manager = new KateCartManager(channel);

export const dialogs = new KateDialogs(channel);

export const developer = new KateDeveloper(channel);

window.addEventListener("focus", () => {
  channel.send_and_ignore_result("kate:special.focus", {});
});

// NOTE: this is a best-effort to avoid the game accidentally trapping focus
//       and breaking keyboard/gamepad input, it's not a security measure;
//       there is no way of making it secure from within the cartridge as
//       we have to assume all cartridge code is malicious and hostile.
const cover = document.createElement("div");
cover.style.display = "block";
cover.style.position = "absolute";
cover.style.top = "0px";
cover.style.left = "0px";
cover.style.width = "100%";
cover.style.height = "100%";
const highest_zindex = /* prettier-ignore */ String((2**32)/2 - 1);

window.addEventListener("load", () => {
  document.body?.appendChild(cover);
  setInterval(() => {
    cover.style.zIndex = highest_zindex;
  }, 1_000);
});

// Forward log messages to Kate kernel
const levels = {
  log: "info",
  debug: "debug",
  info: "info",
  warn: "warn",
  trace: "trace",
  error: "error",
};
for (const [fn, level] of Object.entries(levels)) {
  const bare_fn = (console as any)[fn] as (...args: any[]) => void;
  (console as any)[fn] = (...args: any[]) => {
    channel.send_and_ignore_result("kate:special.log", { level, message: serialise(args) });
    bare_fn.call(console, ...args);
  };
}

window.addEventListener("error", (ev) => {
  channel.send_and_ignore_result("kate:special.log", {
    level: "error",
    message: serialise([
      `Unhandled error at ${ev.filename}:${ev.lineno}:${ev.colno}:\n\n${ev.message}`,
      ev.error,
    ]),
  });
});

window.addEventListener("unhandledrejection", (ev) => {
  channel.send_and_ignore_result("kate:special.log", {
    level: "error",
    message: serialise([`Unhandled promise rejection:`, ev.reason]),
  });
});

pointer_input.monitor(cover);

export type KateAPI = {
  events: typeof events;
  cart_fs: typeof cart_fs;
  store: typeof store;
  file_store: typeof file_store;
  input: typeof input;
  pointer_input: typeof pointer_input;
  timer: typeof timer;
  capture: typeof capture;
  browser: typeof browser;
  device_files: typeof device_files;
  cart_manager: typeof cart_manager;
  dialogs: typeof dialogs;
  developer: typeof developer;
};

declare global {
  var KateAPI: KateAPI;
  namespace KateTypes {
    export {
      InputKey,
      KateInput,
      KatePointerInput,
      KateTimer,
      KateBrowser,
      KateObjectStore,
      PointerLocation,
      PointerClick,
      DeviceFileHandle,
      FileBucket,
      KateFile,
    };

    export namespace object_store {
      export { ObjectMetadata, Object, Usage };
    }

    export namespace developer {
      export { DeveloperProfile };
    }
  }
}

import "./lockdown";
