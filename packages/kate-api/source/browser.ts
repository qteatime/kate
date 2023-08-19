import type { KateIPC } from "./channel";

export class KateBrowser {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  open(url: URL): void {
    this.#channel.call("kate:browser.open", { url: url.toString() });
  }

  download(filename: string, data: Uint8Array) {
    this.#channel.call("kate:browser.download", { filename, data });
  }
}
