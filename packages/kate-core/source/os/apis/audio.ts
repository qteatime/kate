/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { make_id } from "../../utils";
import type { KateKernel } from "../../kernel";

export class KateAudioServer {
  private channels = new Map<string, AudioChannel>();
  private sources = new Map<string, AudioSource>();

  get audio_context() {
    return this.kernel.console.audio.context;
  }

  constructor(readonly kernel: KateKernel) {}

  async create_channel(max_tracks: number) {
    const id = make_id();
    const channel = new AudioChannel(this, id, max_tracks);
    this.channels.set(id, channel);
    return channel;
  }

  async load_sound(bytes: Uint8Array) {
    const id = make_id();
    const source = await AudioSource.from_bytes(this, id, bytes);
    this.sources.set(id, source);
    return source;
  }

  get_channel(id: string) {
    const channel = this.channels.get(id);
    if (channel == null) {
      throw new Error(`Unknown channel ${id}`);
    }
    return channel;
  }

  get_source(id: string) {
    const source = this.sources.get(id);
    if (source == null) {
      throw new Error(`Unknown source ${id}`);
    }
    return source;
  }

  async stop() {
    for (const channel of this.channels.values()) {
      await channel.stop_all_sources();
    }
  }
}

export class AudioChannel {
  readonly volume: GainNode;
  private sources: AudioBufferSourceNode[] = [];

  constructor(
    readonly server: KateAudioServer,
    readonly id: string,
    readonly max_tracks: number = 1
  ) {
    this.volume = server.audio_context.createGain();
    this.volume.connect(server.audio_context.destination);
  }

  get input() {
    return this.volume;
  }

  async get_volume() {
    return this.volume.gain.value;
  }

  async set_volume(value: number) {
    this.volume.gain.value = value;
  }

  async stop_all_sources() {
    for (const source of this.sources) {
      source.stop();
      source.disconnect();
    }
    this.sources = [];
  }

  async play(sound: AudioSource, loop: boolean) {
    const node = this.server.audio_context.createBufferSource();
    node.buffer = sound.buffer;
    node.loop = loop;
    this.sources.push(node);
    while (this.sources.length > this.max_tracks) {
      const source = this.sources.shift()!;
      source.stop();
      source.disconnect();
    }
    node.connect(this.input);
    node.start();
  }
}

export class AudioSource {
  constructor(readonly id: string, readonly buffer: AudioBuffer) {}

  static async from_bytes(server: KateAudioServer, id: string, bytes: Uint8Array) {
    const buffer = await server.audio_context.decodeAudioData(bytes.buffer);
    return new AudioSource(id, buffer);
  }
}
