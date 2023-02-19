import type { KateIPC } from "./channel";

export class KateAudio {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async create_channel(
    name: string,
    max_tracks: number = 1
  ): Promise<KateAudioChannel> {
    const { id, volume } = await this.#channel.call<any>(
      "kate:audio.create-channel",
      { max_tracks }
    );
    return new KateAudioChannel(this, name, id, max_tracks, volume);
  }

  async resume_channel(channel: KateAudioChannel) {
    await this.#channel.call("kate:audio.resume-channel", { id: channel.id });
  }

  async pause_channel(channel: KateAudioChannel) {
    await this.#channel.call("kate:audio.pause-channel", { id: channel.id });
  }

  async stop_all_sources(channel: KateAudioChannel) {
    await this.#channel.call("kate:audio.stop-all-sources", { id: channel.id });
  }

  async change_channel_volume(channel: KateAudioChannel, value: number) {
    await this.#channel.call("kate:audio.change-volume", {
      id: channel.id,
      volume: value,
    });
  }

  async load_audio(mime: string, bytes: Uint8Array) {
    const audio: string = await this.#channel.call("kate:audio.load", {
      mime,
      bytes,
    });
    return new KateAudioSource(this, audio);
  }

  async play(channel: KateAudioChannel, audio: KateAudioSource, loop: boolean) {
    await this.#channel.call("kate:audio.play", {
      channel: channel.id,
      source: audio.id,
      loop: loop,
    });
  }
}

export class KateAudioSource {
  constructor(readonly audio: KateAudio, readonly id: string) {}
}

export class KateAudioChannel {
  constructor(
    readonly audio: KateAudio,
    readonly name: string,
    readonly id: string,
    readonly max_tracks: number,
    private _volume: number
  ) {}

  get volume() {
    return this._volume;
  }

  async set_volume(value: number) {
    if (value < 0 || value > 1) {
      throw new Error(`Invalid volume value ${value}`);
    }

    this._volume = value;
    this.audio.change_channel_volume(this, value);
  }

  async resume() {
    return this.audio.resume_channel(this);
  }

  async pause() {
    return this.audio.pause_channel(this);
  }

  async stop_all_sources() {
    return this.audio.stop_all_sources(this);
  }

  async play(source: KateAudioSource, loop: boolean) {
    return this.audio.play(this, source, loop);
  }
}
