import type { KateOS, KateIPCChannel, KateAudioServer } from "../os";
import { make_id } from "../utils";
import { VirtualConsole } from "./virtual";
import { translate_html } from "./translate-html";
import * as Cart from "../cart";

export type RuntimeEnvConfig = {
  cart: Cart.CartMeta;
  read_file: (path: string) => Promise<Cart.File>;
  local_storage: { [key: string]: string };
};

export type RuntimeEnv = RuntimeEnvConfig & {
  secret: string;
  audio_server: KateAudioServer;
  frame: HTMLIFrameElement;
  channel: KateIPCChannel;
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

export class CRW_Process extends CR_Process {
  constructor(
    readonly runtime: CR_Web_archive,
    readonly frame: HTMLIFrameElement,
    readonly secret: string,
    readonly channel: KateIPCChannel,
    readonly audio: KateAudioServer
  ) {
    super();
  }

  get node() {
    return this.frame;
  }

  async exit() {
    this.frame.src = "about:blank";
    this.frame.remove();
    this.channel?.dispose();
    await this.audio.stop();
  }

  async pause() {
    this.channel?.send({
      type: "kate:paused",
      state: true,
    });
  }

  async unpause() {
    this.channel?.send({
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
    const env: RuntimeEnv = {
      ...this.env,
      secret: secret,
      frame: frame,
      audio_server: audio_server,
      channel: null as any,
    };

    const channel = os.ipc.add_process(env);

    frame.className = "kate-game-frame kate-game-frame-defaults";
    (frame as any).sandbox = "allow-scripts";
    frame.allow = "";
    (frame as any).csp =
      "default-src data: blob: 'unsafe-inline' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; navigate-to 'none'";
    this.console.on_input_changed.listen((ev) => {
      channel.send({
        type: "kate:input-state-changed",
        key: ev.key,
        is_down: ev.is_down,
      });
    });
    this.console.on_key_pressed.listen((key) => {
      channel.send({
        type: "kate:input-key-pressed",
        key: key,
      });
    });

    frame.src = URL.createObjectURL(
      new Blob([await this.proxy_html(env)], { type: "text/html" })
    );
    frame.scrolling = "no";
    return new CRW_Process(this, frame, secret, channel, audio_server);
  }

  async proxy_html(env: RuntimeEnv) {
    return translate_html(this.env.cart.runtime.html, env);
  }
}
