import { KateAudio, KateAudioChannel, KateAudioSource } from "./audio";
import { KateCartFS } from "./cart-fs";
import { KateIPC } from "./channel";
import { InputKey, ExtendedInputKey, KateInput } from "./input";
import { KateKVStore } from "./kv-store";
import { KateTimer } from "./timer";

declare var KATE_SECRET: string;

const channel = new KateIPC(KATE_SECRET, window.parent);
channel.setup();

export const events = channel.events;

export const cart_fs = new KateCartFS(channel);

export const kv_store = new KateKVStore(channel);

export const input = new KateInput(channel);
input.setup();

export const audio = new KateAudio(channel);

export const timer = new KateTimer();
timer.setup();

export const focus = () => {
  channel.send_and_ignore_result("kate:special.focus", {});
};

export type KateAPI = {
  events: typeof events;
  cart_fs: typeof cart_fs;
  kv_store: typeof kv_store;
  input: typeof input;
  audio: typeof audio;
  timer: typeof timer;
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
      ExtendedInputKey,
      KateInput,
      KateTimer,
      KateKVStore,
    };
  }
}
