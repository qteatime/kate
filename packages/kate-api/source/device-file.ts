/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateIPC } from "./channel";
import { Pathname } from "./util";

type HandleRef = { id: string; path: string };

export class KateDeviceFileAccess {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async request_file(options: {
    multiple?: boolean;
    strict?: boolean;
    types: { type: string; extensions: string[] }[];
  }) {
    const handles = (await this.#channel.call(
      "kate:device-fs.request-file",
      options
    )) as HandleRef[];
    return handles.map((x) => {
      return new DeviceFileHandle(this.#channel, x.id, x.path);
    });
  }

  async request_directory() {
    const handles = (await this.#channel.call(
      "kate:device-fs.request-directory",
      {}
    )) as HandleRef[];
    return handles.map(
      (x) => new DeviceFileHandle(this.#channel, x.id, x.path)
    );
  }
}

export class DeviceFileHandle {
  #channel: KateIPC;
  readonly relative_path: Pathname;

  constructor(channel: KateIPC, private _id: string, path: string) {
    this.#channel = channel;
    this.relative_path = Pathname.from_string(path);
  }

  async read(): Promise<Uint8Array> {
    return await this.#channel.call("kate:device-fs.read-file", {
      id: this._id,
    });
  }
}
