import * as Cart from "../../../schema/generated/cartridge";
import type { KateOS, KateIPCChannel, KateAudioServer } from "../os";
import { bridges } from "../../../kate-bridges/build";
import { make_id, unreachable } from "../../../util/build";
import { InputKey, VirtualConsole } from "./virtual";

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
    this.console.on_input_changed.listen((ev) => {
      channel.send({
        type: "kate:input-state-changed",
        key: ev.key,
        is_down: ev.is_down,
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
    const decoder = new TextDecoder("utf-8");
    const dom = new DOMParser().parseFromString(this.data.html, "text/html");
    const secret_el = document.createElement("script");
    secret_el.textContent = `
      var KATE_SECRET = ${JSON.stringify(secret)};
      var KATE_LOCAL_STORAGE = ${JSON.stringify(this.local_storage ?? {})};
      ${bridges["kate-api.js"]}
    `;
    dom.head.insertBefore(secret_el, dom.head.firstChild);
    const zoom_style = document.createElement("style");
    zoom_style.textContent = `
    :root {
      zoom: ${this.console.body.getAttribute("data-zoom") ?? "0"};
    }
    `;
    dom.head.appendChild(zoom_style);
    for (const bridge of this.data.bridges) {
      this.apply_bridge(dom, bridge, secret_el);
    }
    for (const script of Array.from(dom.querySelectorAll("script"))) {
      if (script.src) {
        const file = this.get_file(script.src);
        if (file != null) {
          script.removeAttribute("src");
          script.removeAttribute("type");
          script.textContent = decoder.decode(file.data);
        }
      }
    }
    for (const link of Array.from(dom.querySelectorAll("link"))) {
      if (link.href) {
        if (link.rel === "stylesheet") {
          const file = this.get_file(link.href);
          if (file != null) {
            const style = dom.createElement("style");
            style.textContent = this.transform_css_urls(
              new URL(link.href).pathname,
              decoder.decode(file.data)
            );
            link.parentNode?.insertBefore(style, link);
            link.remove();
          }
        } else {
          link.href = this.get_data_url(link.href);
        }
      }
    }
    return dom.documentElement.outerHTML;
  }

  private transform_css_urls(base: string, code: string) {
    return code.replace(/\burl\(("[^"]+")\)/g, (_, url_string) => {
      const url = this.resolve_pathname(base, JSON.parse(url_string));
      const data_url = this.get_data_url(
        new URL(url, "http://localhost").toString()
      );
      return `url(${JSON.stringify(data_url)})`;
    });
  }

  private resolve_pathname(base: string, url0: string) {
    if (url0.startsWith("/")) {
      return url0;
    } else {
      const x0 = base.endsWith("/") ? base : base + "/";
      const x1 = x0.endsWith(".css")
        ? x0.split("/").slice(0, -1).join("/")
        : x0;
      return x1 + "/" + url0;
    }
  }

  private apply_bridge(dom: Document, bridge: Cart.Bridge, secret_node: Node) {
    const wrap = (source: string) => {
      return `void function(exports) {
        ${source}
      }({});`;
    };

    switch (bridge.$tag) {
      case Cart.Bridge.$Tags.RPG_maker_mv: {
        const proxy = wrap(bridges["rpgmk-mv.js"]);
        const script = dom.createElement("script");
        script.textContent = wrap(proxy);
        const scripts = Array.from(dom.querySelectorAll("script"));
        const main_script = scripts.find((x) => x.src.includes("js/main.js"));
        if (main_script != null) {
          main_script.parentNode!.insertBefore(script, main_script);
        } else {
          dom.body.appendChild(script);
        }
        break;
      }

      case Cart.Bridge.$Tags.Renpy: {
        this.append_proxy(bridges["renpy.js"], dom, secret_node);
        break;
      }

      case Cart.Bridge.$Tags.Network_proxy: {
        this.append_proxy(bridges["standard-network.js"], dom, secret_node);
        break;
      }

      case Cart.Bridge.$Tags.Local_storage_proxy: {
        this.append_proxy(bridges["local-storage.js"], dom, secret_node);
        break;
      }

      case Cart.Bridge.$Tags.Input_proxy: {
        const code = bridges["input.js"];
        const keys = this.generate_mappings(bridge.mapping);
        this.append_proxy(
          `const key_mapping = ${keys};\n${code}`,
          dom,
          secret_node
        );
        break;
      }

      default:
        throw unreachable(bridge, "kate bridge");
    }
  }

  private generate_mappings(map: Map<Cart.VirtualKey, Cart.KeyboardKey>) {
    const pairs = [...map.entries()].map(([k, v]) => [
      this.virtual_key_to_code(k),
      [v.key, v.code, Number(v.key_code)],
    ]);
    return JSON.stringify(Object.fromEntries(pairs), null, 2);
  }

  private virtual_key_to_code(key: Cart.VirtualKey): InputKey {
    switch (key.$tag) {
      case Cart.VirtualKey.$Tags.Up:
        return "up";
      case Cart.VirtualKey.$Tags.Right:
        return "right";
      case Cart.VirtualKey.$Tags.Down:
        return "down";
      case Cart.VirtualKey.$Tags.Left:
        return "left";
      case Cart.VirtualKey.$Tags.O:
        return "o";
      case Cart.VirtualKey.$Tags.X:
        return "x";
      case Cart.VirtualKey.$Tags.L_trigger:
        return "ltrigger";
      case Cart.VirtualKey.$Tags.R_trigger:
        return "rtrigger";
      case Cart.VirtualKey.$Tags.Menu:
        return "menu";
      case Cart.VirtualKey.$Tags.Capture:
        return "capture";
      default:
        throw unreachable(key, "virtual key");
    }
  }

  private append_proxy(proxy: string, dom: Document, ref: Node) {
    const wrap = (source: string) => {
      return `void function(exports) {
        ${source}
      }({});`;
    };

    const script = dom.createElement("script");
    script.textContent = wrap(proxy);
    if (ref.nextSibling != null) {
      ref.parentNode!.insertBefore(script, ref.nextSibling);
    } else {
      dom.head.appendChild(script);
    }
  }

  get_file(url: string) {
    const path = new URL(url).pathname;
    return this.cart.files.find((x) => x.path === path);
  }

  get_data_url(url: string) {
    const file = this.get_file(url);
    if (file != null) {
      const content = Array.from(file.data)
        .map((x) => String.fromCharCode(x))
        .join("");
      return `data:${file.mime};base64,${btoa(content)}`;
    } else {
      return url;
    }
  }
}
