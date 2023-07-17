import type { KateIPC } from "./channel";

export class KateBrowser {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async open(url: URL): Promise<void> {
    await this.#channel.call("kate:browser.open", { url: url.toString() });
  }
}
