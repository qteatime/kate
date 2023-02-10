import { KateAudio } from "./audio";
import { KateCartFS } from "./cart-fs";
import { KateIPC } from "./channel";
import { KateInput } from "./input";
import { KateKVStore } from "./kv-store";

declare var KATE_SECRET: string;

const channel = new KateIPC(KATE_SECRET, window.parent);
channel.setup();

export const events = channel.events;

export const cart_fs = new KateCartFS(channel);

export const kv_store = new KateKVStore(channel);

export const input = new KateInput(channel);
input.setup();

export const audio = new KateAudio(channel);

export type KateAPI = {
  events: typeof events;
  cart_fs: typeof cart_fs;
  kv_store: typeof kv_store;
  input: typeof input;
  audio: typeof audio;
};
