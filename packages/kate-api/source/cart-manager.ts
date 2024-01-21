/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateIPC } from "./channel";
import type { KateFile } from "./file-store";

export class KateCartManager {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async install_from_bytes(cartridge: Uint8Array) {
    await this.#channel.call("kate:cart-manager.install-from-bytes", { cartridge }, [
      cartridge.buffer,
    ]);
  }

  async install_from_file(file: KateFile) {
    await this.#channel.call("kate:cart-manager.install-from-file", {
      bucket_id: file.bucket.id,
      file_id: file.id,
    });
  }
}
