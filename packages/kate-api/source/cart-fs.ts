import type { KateIPC } from "./channel";
import { Pathname } from "./util";

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
    const path = Pathname.from_string(path0)
      .normalise()
      .make_absolute()
      .as_string();
    return this.#channel.call("kate:cart.read-file", { path });
  }

  async get_file_url(path: string): Promise<string> {
    const file = await this.read_file(path);
    const blob = new Blob([file.bytes], { type: file.mime });
    return URL.createObjectURL(blob);
  }
}
