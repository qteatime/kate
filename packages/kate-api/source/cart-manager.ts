/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
