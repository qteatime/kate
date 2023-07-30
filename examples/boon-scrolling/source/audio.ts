interface IAudioNode {
  audio_context: AudioContext;
  input: AudioNode;
  connect(node: AudioSourceNode): IAudioNode;
}

export class AudioServer implements IAudioNode {
  constructor(readonly audio_context: AudioContext) {}

  get input() {
    return this.audio_context.destination;
  }

  connect(node: AudioSourceNode) {
    node.output.connect(this.input);
    return this;
  }
}

const default_context = new AudioContext();
export const default_server = new AudioServer(default_context);
default_context.resume();

export class AudioChannel implements IAudioNode {
  readonly volume: GainNode;
  readonly audio_context: AudioContext;
  private sources: AudioSourceNode[] = [];

  constructor(readonly server: IAudioNode, readonly max_tracks: number = 1) {
    if (max_tracks < 1) {
      throw new Error(`max_tracks must be a positive integer`);
    }
    this.audio_context = server.audio_context;
    this.volume = server.audio_context.createGain();
    this.volume.connect(server.input);
  }

  get input() {
    return this.volume;
  }

  connect(node: AudioSourceNode) {
    while (this.sources.length >= this.max_tracks) {
      const node = this.sources.shift()!;
      node.pause();
      node.output.disconnect();
    }
    this.sources.push(node);
    node.output.connect(this.input);
    return this;
  }

  pause() {
    for (const node of this.sources) {
      node.pause();
    }
    return this;
  }

  resume() {
    for (const node of this.sources) {
      node.resume();
    }
    return this;
  }

  load_source(source: AudioSource) {
    return new AudioSourceNode(this, source).connect();
  }

  play(source: AudioSource, options: AudioPlayOptions) {
    const audio = this.load_source(source);
    if (options.loop) {
      audio.loop(options.loop.from, options.loop.to);
    }
    audio.resume();
    return audio;
  }
}

type AudioPlayOptions = {
  loop?: {
    from?: number;
    to?: number;
  };
};

export class AudioSource {
  constructor(readonly buffer: AudioBuffer) {}

  static async from_bytes(server: AudioServer, bytes: Uint8Array) {
    const buffer = await server.audio_context.decodeAudioData(bytes.buffer);
    return new AudioSource(buffer);
  }
}

export class AudioSourceNode {
  readonly output: AudioBufferSourceNode;
  private _connected: boolean = false;

  constructor(readonly parent: IAudioNode, source: AudioSource) {
    this.output = parent.audio_context.createBufferSource();
    this.output.buffer = source.buffer;
  }

  loop(from?: number, to?: number) {
    this.output.loop = true;
    this.output.loopStart = from ?? 0;
    this.output.loopEnd = to ?? 0;
    return this;
  }

  connect() {
    if (this._connected) {
      throw new Error(`connect() called on source that is already connected`);
    }
    this._connected = true;
    this.parent.connect(this);
    return this;
  }

  resume(when?: number, offset?: number, duration?: number) {
    this.output.start(when, offset, duration);
    return this;
  }

  pause(when?: number) {
    this.output.stop(when);
    return this;
  }
}
