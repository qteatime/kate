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
 */

import type { KateKernel } from "../kernel";
import { AudioChannel, AudioSource, KateAudioServer } from "./apis";

export class KateSfx {
  readonly server: KateAudioServer;
  readonly channel: AudioChannel;
  readonly sources: {
    shutter: AudioSource;
    invalid: AudioSource;
    select: AudioSource;
    cursor: AudioSource;
  };
  private _enabled: boolean = true;

  constructor(
    readonly console: KateKernel,
    server: KateAudioServer,
    channel: AudioChannel,
    sources: KateSfx["sources"]
  ) {
    this.server = server;
    this.channel = channel;
    this.sources = sources;
  }

  static async make(kernel: KateKernel) {
    const server = new KateAudioServer(kernel);
    const channel = await server.create_channel(1);
    const shutter = await server.load_sound(await get_sfx("sfx/shutter.wav"));
    const invalid = await server.load_sound(await get_sfx("sfx/invalid.wav"));
    const select = await server.load_sound(await get_sfx("sfx/select.wav"));
    const cursor = await server.load_sound(await get_sfx("sfx/cursor.wav"));
    return new KateSfx(kernel, server, channel, {
      shutter,
      invalid,
      select,
      cursor,
    });
  }

  set_enabled(enabled: boolean) {
    this._enabled = enabled;
  }

  play(source: keyof KateSfx["sources"]) {
    if (this._enabled) {
      this.channel.play(this.sources[source], false);
    }
  }
}

async function get_sfx(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
