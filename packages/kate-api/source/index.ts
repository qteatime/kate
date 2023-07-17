import { KateAudio, KateAudioChannel, KateAudioSource } from "./audio";
import { KateBrowser } from "./browser";
import { KateCapture } from "./capture";
import { KateCartFS } from "./cart-fs";
import { KateIPC } from "./channel";
import { InputKey, ExtendedInputKey, KateInput } from "./input";
import { KateObjectStore } from "./object-store";
import {
  KatePointerInput,
  PointerClick,
  PointerLocation,
} from "./pointer-input";
import { KateTimer } from "./timer";

declare var KATE_SECRET: string;

const channel = new KateIPC(KATE_SECRET, window.parent);
channel.setup();

export const events = channel.events;

export const cart_fs = new KateCartFS(channel);

export const store = new KateObjectStore(channel);

export const audio = new KateAudio(channel);

export const timer = new KateTimer();
timer.setup();

export const input = new KateInput(channel, timer);
input.setup();

export const pointer_input = new KatePointerInput(timer);

export const capture = new KateCapture(channel, input);
capture.setup();

export const browser = new KateBrowser(channel);

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

pointer_input.monitor(cover);

export type KateAPI = {
  events: typeof events;
  cart_fs: typeof cart_fs;
  store: typeof store;
  input: typeof input;
  pointer_input: typeof pointer_input;
  audio: typeof audio;
  timer: typeof timer;
  capture: typeof capture;
  browser: typeof browser;
};

declare global {
  var KateAPI: KateAPI;
  namespace KateTypes {
    export {
      KateAudio,
      KateAudioSource,
      KateAudioChannel,
      InputKey,
      KateInput,
      KatePointerInput,
      ExtendedInputKey,
      KateTimer,
      KateBrowser,
      KateObjectStore,
      PointerLocation,
      PointerClick,
    };
  }
}
