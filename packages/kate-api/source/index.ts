import { KateAudio, KateAudioChannel, KateAudioSource } from "./audio";
import { KateCapture } from "./capture";
import { KateCartFS } from "./cart-fs";
import { KateIPC } from "./channel";
import { InputKey, ExtendedInputKey, KateInput } from "./input";
import { KateObjectStore } from "./object-store";
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

export const capture = new KateCapture(channel, input);
capture.setup();

export const focus = () => {
  channel.send_and_ignore_result("kate:special.focus", {});
};

export type KateAPI = {
  events: typeof events;
  cart_fs: typeof cart_fs;
  store: typeof store;
  input: typeof input;
  audio: typeof audio;
  timer: typeof timer;
  capture: typeof capture;
  focus: () => void;
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
      ExtendedInputKey,
      KateTimer,
      KateObjectStore,
    };
  }
}
