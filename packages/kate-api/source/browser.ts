/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
