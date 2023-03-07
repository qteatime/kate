import { make_id } from "../../../../util/build/random";
import type { KateOS } from "../os";

export class KateAudioServer {
  private channels = new Map<string, AudioChannel>();
  private sources = new Map<string, AudioSource>();

  get audio_context() {
    return this.os.kernel.console.audio_context;
  }

  constructor(readonly os: KateOS) {}

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
}

class AudioChannel {
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

class AudioSource {
  constructor(readonly id: string, readonly buffer: AudioBuffer) {}

  static async from_bytes(
    server: KateAudioServer,
    id: string,
    bytes: Uint8Array
  ) {
    const buffer = await server.audio_context.decodeAudioData(bytes.buffer);
    return new AudioSource(id, buffer);
  }
}
