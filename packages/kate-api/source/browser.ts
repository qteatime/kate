/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateIPC } from "./channel";
import type { KateFile } from "./file-store";

export class KateBrowser {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  open(url: URL): void {
    this.#channel.call("kate:browser.open", { url: url.toString() });
  }

  download_from_bytes(filename: string, data: Uint8Array) {
    this.#channel.call("kate:browser.download-from-bytes", { filename, data });
  }

  download_from_file(filename: string, file: KateFile) {
    this.#channel.call("kate:browser.download-from-file", {
      filename,
      bucket_id: file.bucket.id,
      file_id: file.id,
    });
  }
}
