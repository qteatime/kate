import type { KateIPC } from "./channel";

interface File {
  mime: string;
  bytes: Uint8Array;
}

export class KateCartFS {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  read_file(path0: string): Promise<File> {
    const path = new URL(path0, "http://localhost").pathname;
    return this.#channel.call("kate:cart.read-file", { path });
  }

  async get_file_url(path: string): Promise<string> {
    const file = await this.read_file(path);
    const blob = new Blob([file.bytes], { type: file.mime });
    return URL.createObjectURL(blob);
  }
}