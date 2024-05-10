/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 *
 * This file is part of the cartridge linking exception as described
 * in COPYING.
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
    return handles.map((x) => new DeviceFileHandle(this.#channel, x.id, x.path));
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
