import type { KateKernel } from "../kernel";
import { AudioChannel, AudioSource, KateAudioServer } from "./apis";

export class KateSfx {
  readonly server: KateAudioServer;
  readonly channel: AudioChannel;
  readonly sources: {
    shutter: AudioSource;
  };

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
    const shutter = await server.load_sound(await get_sfx("/sfx/shutter.wav"));
    return new KateSfx(kernel, server, channel, { shutter });
  }

  play(source: keyof KateSfx["sources"]) {
    this.channel.play(this.sources[source], false);
  }
}

async function get_sfx(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
