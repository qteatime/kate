import * as Cart from "../../../schema/generated/cartridge";
import type { KateOS, KateIPCChannel, KateAudioServer } from "../os";
import { make_id } from "../../../util/build";
import { VirtualConsole } from "./virtual";
import { translate_html } from "./translate-html";

export class KateRuntimes {
  constructor(readonly console: VirtualConsole) {}

  from_cartridge(
    cart: Cart.Cartridge,
    local_storage: { [key: string]: string }
  ): CartRuntime {
    switch (cart.platform.$tag) {
      case Cart.Platform.$Tags.Web_archive:
        return new CR_Web_archive(
          this.console,
          cart.id,
          cart,
          cart.platform,
          local_storage
        );

      default:
        throw new Error(`Unsupported cartridge`);
    }
  }
}

export abstract class CartRuntime {
  abstract run(os: KateOS): CR_Process;
}

export abstract class CR_Process {
  abstract exit(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract unpause(): Promise<void>;
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
    readonly id: string,
    readonly cart: Cart.Cartridge,
    readonly data: Cart.Platform.Web_archive,
    readonly local_storage: { [key: string]: string }
  ) {
    super();
  }

  run(os: KateOS) {
    const secret = make_id();
    const frame = document.createElement("iframe");
    const audio_server = os.make_audio_server();
    const channel = os.ipc.add_process(
      secret,
      this.cart,
      () => frame.contentWindow,
      audio_server
    );

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
      new Blob([this.proxy_html(secret)], { type: "text/html" })
    );
    frame.scrolling = "no";
    this.console.screen.appendChild(frame);
    return new CRW_Process(this, frame, secret, channel, audio_server);
  }

  proxy_html(secret: string) {
    return translate_html(this.data.html, {
      secret,
      zoom: this.console.scale,
      bridges: this.data.bridges,
      cart: this.cart,
      local_storage: this.local_storage,
    });
  }
}
