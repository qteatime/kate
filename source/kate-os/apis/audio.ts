import { make_id } from "../../util/random";
import { KateOS } from "../os";

export class KateAudioServer {
  private channels = new Map<string, AudioChannel>();
  private sources = new Map<string, AudioSource>();

  constructor(readonly os: KateOS) {}

  async create_channel() {
    const id = make_id();
    const channel = new AudioChannel(id);
    this.channels.set(id, channel);
    return channel;
  }

  async load_sound(bytes: Uint8Array) {
    const id = make_id();
    const source = await AudioSource.from_bytes(id, bytes);
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
  readonly output: AudioDestinationNode;
  readonly context: AudioContext;
  private source: AudioNode | null = null;

  constructor(readonly id: string) {
    this.context = new AudioContext();
    this.output = this.context.destination;
    this.volume = this.context.createGain();
    this.volume.connect(this.output);
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

  async resume() {
    await this.context.resume();
  }

  async suspend() {
    await this.context.suspend();
  }

  async play(sound: AudioSource, loop: boolean) {
    if (this.source) {
      this.source.disconnect();
    }
    const node = this.context.createBufferSource();
    node.buffer = sound.buffer;
    node.loop = loop;
    node.connect(this.input);
  }
}

class AudioSource {
  constructor(readonly id: string, readonly buffer: AudioBuffer) {}

  static async from_bytes(id: string, bytes: Uint8Array) {
    const context = new AudioContext();
    const buffer = await context.decodeAudioData(bytes.buffer);
    return new AudioSource(id, buffer);
  }
}
