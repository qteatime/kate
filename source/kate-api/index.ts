import { KateCartFS } from "./cart-fs";
import { KateIPC } from "./channel";
import { KateKVStore } from "./kv-store";

declare var KATE_SECRET: string;

const channel = new KateIPC(KATE_SECRET, window.parent);
channel.setup();

export const cart_fs = new KateCartFS(channel);
export const kv_store = new KateKVStore(channel);