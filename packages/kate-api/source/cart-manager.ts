import type { KateIPC } from "./channel";

export class KateCartManager {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async install(cartridge: Uint8Array) {
    await this.#channel.call("kate:cart-manager.install", { cartridge }, [
      cartridge.buffer,
    ]);
  }
}
