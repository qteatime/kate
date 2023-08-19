import type { KateOS, KateIPCChannel, KateAudioServer } from "../os";
import { make_id } from "../utils";
import { VirtualConsole } from "./virtual";
import { translate_html } from "./translate-html";
import * as Cart from "../cart";

export type RuntimeEnvConfig = {
  console: VirtualConsole;
  cart: Cart.CartMeta;
  read_file: (path: string) => Promise<Cart.BasicFile>;
  local_storage: unknown;
  on_playtime_update: (time: number) => void;
  is_foreground: (cart: Cart.CartMeta) => boolean;
};

export type RuntimeEnv = RuntimeEnvConfig & {
  secret: string;
  audio_server: KateAudioServer;
  frame: HTMLIFrameElement;
  channel: KateIPCChannel;
  capture_tokens: Set<string>;
};

export class KateRuntimes {
  constructor(readonly console: VirtualConsole) {}

  from_cartridge(cart: Cart.CartMeta, env: RuntimeEnvConfig): CartRuntime {
    switch (cart.runtime.type) {
      case "web-archive":
        return new CR_Web_archive(
          this.console,
          cart.metadata,
          cart.runtime,
          env
        );

      default:
        throw new Error(`Unsupported cartridge`);
    }
  }
}

export abstract class CartRuntime {
  abstract run(os: KateOS): Promise<CR_Process>;
}

export abstract class CR_Process {
  abstract exit(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract unpause(): Promise<void>;
  abstract node: Node;
}

class UpdateTimeLoop {
  readonly UPDATE_FREQUENCY = 1000 * 60 * 10; // 10 min
  private last_stored: Date | null = null;
  private handler: any = null;

  constructor(
    readonly start_time: Date,
    readonly on_update: (time: number) => void
  ) {}

  start() {
    this.handler = setTimeout(this.tick, this.UPDATE_FREQUENCY);
  }

  tick = () => {
    clearTimeout(this.handler);
    this.update();
    this.handler = setTimeout(this.tick, this.UPDATE_FREQUENCY);
  };

  private update() {
    const now = new Date();
    const elapsed =
      now.getTime() - (this.last_stored ?? this.start_time).getTime();
    this.last_stored = now;
    this.on_update(elapsed);
  }

  stop() {
    clearTimeout(this.handler);
    this.update();
  }
}

export class CRW_Process extends CR_Process {
  private time_loop;
  private _setup: boolean = false;

  constructor(readonly runtime: CR_Web_archive, readonly env: RuntimeEnv) {
    super();
    this.time_loop = new UpdateTimeLoop(new Date(), env.on_playtime_update);
  }

  get node() {
    return this.env.frame;
  }

  async setup() {
    if (this._setup) {
      throw new Error(`setup() called twice`);
    }
    this._setup = true;
    this.time_loop.start();
  }

  async exit() {
    this.env.frame.src = "about:blank";
    this.env.frame.remove();
    this.env.channel?.dispose();
    this.time_loop.stop();
    await this.env.audio_server.stop();
  }

  async pause() {
    this.env.channel?.send({
      type: "kate:paused",
      state: true,
    });
  }

  async unpause() {
    this.env.channel?.send({
      type: "kate:paused",
      state: false,
    });
  }
}

export class CR_Web_archive extends CartRuntime {
  constructor(
    readonly console: VirtualConsole,
    readonly metadata: Cart.Metadata,
    readonly runtime: Cart.WebArchiveRuntime,
    readonly env: RuntimeEnvConfig
  ) {
    super();
  }

  async run(os: KateOS) {
    const secret = make_id();
    const frame = document.createElement("iframe");
    const audio_server = os.make_audio_server();
    const capture_tokens = new Set<string>();
    const env: RuntimeEnv = {
      ...this.env,
      secret: secret,
      frame: frame,
      audio_server: audio_server,
      channel: null as any,
      capture_tokens,
    };

    const channel = os.ipc.add_process(env);
    env.channel = channel;

    frame.className = "kate-game-frame kate-game-frame-defaults";
    (frame as any).sandbox = "allow-scripts";
    frame.allow = "autoplay";
    (frame as any).csp =
      "default-src data: blob: 'unsafe-inline' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; navigate-to 'none'";

    this.console.on_input_changed.listen((ev) => {
      if (env.is_foreground(env.cart)) {
        channel.send({
          type: "kate:input-state-changed",
          key: ev.key,
          is_down: ev.is_down,
        });
      }
    });

    let recording = false;
    this.console.on_key_pressed.listen((key) => {
      if (env.is_foreground(env.cart)) {
        channel.send({
          type: "kate:input-key-pressed",
          key: key,
        });
        if (key.key === "capture") {
          const token = make_id();
          env.capture_tokens.add(token);
          channel.send({ type: "kate:take-screenshot", token });
        }
        if (key.key === "long_capture") {
          recording = !recording;
          if (recording) {
            const token = make_id();
            env.capture_tokens.add(token);
            channel.send({ type: "kate:start-recording", token });
          } else {
            channel.send({ type: "kate:stop-recording" });
          }
        }
      }
    });

    frame.src = URL.createObjectURL(
      new Blob([await this.proxy_html(env)], { type: "text/html" })
    );
    frame.scrolling = "no";
    const process = new CRW_Process(this, env);
    process.setup();
    return process;
  }

  async proxy_html(env: RuntimeEnv) {
    const index_file = await env.read_file(env.cart.runtime.html_path);
    const decoder = new TextDecoder();
    const index = decoder.decode(index_file.data);
    return translate_html(index, env);
  }
}
