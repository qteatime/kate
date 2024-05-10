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
    const path = Pathname.from_string(path0).normalise().make_absolute().as_string();
    return this.#channel.call("kate:cart.read-file", { path });
  }

  async get_file_url(path: string): Promise<string> {
    const file = await this.read_file(path);
    const blob = new Blob([file.bytes], { type: file.mime });
    return URL.createObjectURL(blob);
  }
}
