import type { KateOS } from "../os";
import { Widget, h, append, Widgetable } from "./widget";
import * as UI from "./widget";
import type { ExtendedInputKey } from "../../kernel";
import * as Db from "../../data/db";
import { unreachable } from "../../../../util/build";
import type { KateProcess } from "../apis/processes";

export abstract class Scene {
  readonly canvas: HTMLElement;
  constructor(protected os: KateOS) {
    this.canvas = h("div", { class: "kate-os-screen" }, []);
  }

  async attach(to: HTMLElement) {
    to.appendChild(this.canvas);
    this.canvas.innerHTML = "";
    append(this.render(), this.canvas);
    this.on_attached();
  }

  async detach() {
    this.canvas.remove();
    this.on_detached();
  }

  abstract render(): Widgetable;

  on_attached() {}
  on_detached() {}
}

export class HUD_LoadIndicator extends Scene {
  render() {
    return h("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
  }
}

export class SceneGame extends Scene {
  constructor(os: KateOS, readonly process: KateProcess) {
    super(os);
  }

  on_attached(): void {
    this.os.focus_handler.on_focus_changed.listen(this.handle_focus_changed);
  }

  on_detached(): void {
    this.os.focus_handler.on_focus_changed.remove(this.handle_focus_changed);
  }

  handle_focus_changed = (focus: HTMLElement | null) => {
    if (focus === this.canvas) {
      setTimeout(() => {
        this.process.unpause();
      });
    } else {
      this.process.pause();
    }
  };

  render() {
    return h("div", { class: "kate-os-game" }, [this.process.runtime.node]);
  }
}

export class SceneLicence extends Scene {
  constructor(os: KateOS, readonly title: string, readonly text: string) {
    super(os);
  }

  render() {
    return h("div", { class: "kate-os-simple-screen" }, [
      new UI.Title_bar({
        left: new UI.Section_title(["Legal notices"]),
      }),
      h("div", { class: "kate-os-text-scroll" }, [
        h("div", { class: "kate-os-padding" }, [this.text]),
      ]),
      h("div", { class: "kate-os-statusbar" }, [
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
      ]),
    ]);
  }

  on_attached(): void {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  handle_key_pressed = (key: ExtendedInputKey) => {
    const scroll = this.canvas.querySelector(".kate-os-text-scroll");
    if (scroll == null) {
      return false;
    }

    switch (key) {
      case "up": {
        scroll.scrollBy({ top: -350, behavior: "smooth" });
        return true;
      }
      case "down": {
        scroll.scrollBy({ top: 350, behavior: "smooth" });
        return true;
      }
      case "x": {
        this.handle_close();
        return true;
      }
    }
    return false;
  };

  handle_close = () => {
    this.os.pop_scene();
  };
}

export class SceneBoot extends Scene {
  render() {
    return h("div", { class: "kate-os-logo" }, [
      h("div", { class: "kate-os-logo-image" }, [
        h("div", { class: "kate-os-logo-paw" }, [
          h("i", {}, []),
          h("i", {}, []),
          h("i", {}, []),
        ]),
        h("div", { class: "kate-os-logo-name" }, ["Kate"]),
      ]),
    ]);
  }
}

export class SceneHome extends Scene {
  private cart_map = new Map<Element, typeof Db["cart_meta"]["__schema"]>();

  render_cart(x: {
    id: string;
    title: string;
    thumbnail: { mime: string; bytes: Uint8Array } | null;
  }) {
    return new UI.Button([
      h("div", { class: "kate-os-carts-box" }, [
        h(
          "div",
          { class: "kate-os-carts-image" },
          x.thumbnail
            ? [
                h(
                  "img",
                  {
                    src: URL.createObjectURL(
                      new Blob([x.thumbnail!.bytes], {
                        type: x.thumbnail!.mime,
                      })
                    ),
                  },
                  []
                ),
              ]
            : []
        ),
        h("div", { class: "kate-os-carts-title" }, [x.title]),
      ]),
    ]).on_clicked(() => {
      this.os.processes.run(x.id);
    });
  }

  async show_carts(list: HTMLElement) {
    try {
      const carts = (await this.os.cart_manager.list()).sort(
        (a, b) => b.installed_at.getTime() - a.installed_at.getTime()
      );
      list.textContent = "";
      this.cart_map = new Map();
      for (const x of carts) {
        const child = this.render_cart(x).render();
        this.cart_map.set(child, x);
        list.appendChild(child);
      }
      this.os.focus_handler.focus(
        list.querySelector(".kate-ui-focus-target") ??
          (list.firstElementChild as HTMLElement) ??
          null
      );
    } catch (error) {
      console.error("[Kate] Failed to load cartridges", error);
      this.os.notifications.push(
        "kate:os",
        "Failed to load games",
        `An internal error happened while loading.`
      );
    }
  }

  async show_pop_menu(cart: typeof Db["cart_meta"]["__schema"]) {
    const result = await this.os.dialog.pop_menu(
      "kate:home",
      cart.title,
      [
        { label: "Legal notices", value: "legal" as const },
        { label: "Uninstall", value: "uninstall" as const },
      ],
      "close"
    );
    switch (result) {
      case "uninstall": {
        const should_uninstall = await this.os.dialog.confirm("kate:home", {
          title: `Uninstall ${cart.title}?`,
          message: `This will remove the cartridge and all its related data (including save data).`,
          cancel: "Keep game",
          ok: "Uninstall game",
          dangerous: true,
        });
        if (should_uninstall) {
          this.os.cart_manager.uninstall(cart);
        }
        break;
      }

      case "close": {
        break;
      }

      case "legal": {
        const loading = new HUD_LoadIndicator(this.os);
        this.os.show_hud(loading);
        try {
          const licence = await this.os.cart_manager.read_legal(cart.id);
          const legal = new SceneLicence(this.os, cart.title, licence);
          this.os.push_scene(legal);
        } catch (error) {
          console.error(`Failed to show legal notices for ${cart.id}`, error);
          await this.os.notifications.push(
            "kate:os",
            "Failed to open",
            "Cartridge may be corrupted or not compatible with this version"
          );
        } finally {
          this.os.hide_hud(loading);
        }
        break;
      }

      default: {
        throw unreachable(result);
      }
    }
  }

  render() {
    return h("div", { class: "kate-os-home" }, [
      new UI.Title_bar({
        left: UI.fragment([new UI.Section_title(["Library"])]),
        right: new UI.HBox(10, ["Media", new UI.Icon("rtrigger")]),
      }),
      h("div", { class: "kate-os-carts-scroll" }, [
        h("div", { class: "kate-os-carts" }, []),
      ]),
    ]);
  }

  on_attached() {
    this.update_carts();

    this.os.events.on_cart_inserted.listen(this.update_carts);
    this.os.events.on_cart_removed.listen(this.update_carts);
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  on_detached() {
    this.os.events.on_cart_inserted.remove(this.update_carts);
    this.os.events.on_cart_removed.remove(this.update_carts);
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  private update_carts = () => {
    const home = this.canvas!;
    const carts = home.querySelector(".kate-os-carts")! as HTMLElement;
    this.show_carts(carts);
  };

  handle_key_pressed = (key: ExtendedInputKey) => {
    switch (key) {
      case "menu": {
        for (const [button, cart] of this.cart_map) {
          if (button.classList.contains("focus")) {
            this.show_pop_menu(cart);
            return true;
          }
        }
      }

      case "rtrigger": {
        const media = new SceneMedia(this.os, null);
        this.os.push_scene(media);
        return true;
      }
    }
    return false;
  };
}

export class SceneMedia extends Scene {
  private media = new Map<HTMLElement, typeof Db["media_store"]["__schema"]>();

  constructor(
    os: KateOS,
    readonly filter: null | typeof Db["cart_meta"]["__schema"]
  ) {
    super(os);
  }

  render() {
    return h("div", { class: "kate-os-simple-screen" }, [
      new UI.Title_bar({
        left: new UI.Section_title(["Media"]),
        right: h("div", { class: "kate-os-media-status" }, []),
      }),
      h("div", { class: "kate-os-scroll" }, [
        h("div", { class: "kate-os-media-items" }, []),
      ]),
      h("div", { class: "kate-os-statusbar" }, [
        UI.icon_button("menu", "Options").on_clicked(this.handle_menu),
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
        UI.icon_button("o", "View").on_clicked(this.handle_view),
      ]),
    ]);
  }

  on_attached(): void {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    this.load_media();
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  private async get_media_filtered() {
    const media0 = await this.os.capture.list();
    const filter = this.filter;
    if (filter == null) {
      return { title: "All", media: media0 };
    } else {
      return {
        title: filter.title,
        media: media0.filter((x) => x.cart_id === filter.id),
      };
    }
  }

  private async load_media() {
    const { title, media } = await this.get_media_filtered();
    this.update_status(`${title} (${media.length})`);
    const buttons = await Promise.all(
      media.map(async (x) => [x, await this.make_button(x)] as const)
    );
    const container = this.canvas.querySelector(".kate-os-media-items")!;
    container.textContent = "";
    for (const [meta, button] of buttons) {
      const child = UI.render(button)! as HTMLElement;
      container.append(child);
      this.media.set(child, meta);
    }
  }

  private async make_button(x: typeof Db["media_store"]["__schema"]) {
    const element = new UI.Button([
      h("div", { class: "kate-os-media-thumbnail" }, [
        h("img", { src: x.thumbnail }, []),
        this.make_video_length(x.video_length),
      ]),
    ]).on_clicked(() => this.view(x));
    return element;
  }

  private make_video_length(duration: number | null) {
    if (duration == null) {
      return null;
    } else {
      return h("div", { class: "kate-os-video-duration" }, [
        `${Math.round(duration)}s`,
      ]);
    }
  }

  private update_status(text: string) {
    this.canvas.querySelector(".kate-os-media-status")!.textContent = text;
  }

  handle_close = () => {
    this.os.pop_scene();
  };

  handle_view = () => {
    const current = this.os.focus_handler.current_focus;
    if (current != null) {
      const data = this.media.get(current);
      if (data != null) {
        this.view(data);
      }
    }
  };

  handle_menu = async () => {
    const current = this.os.focus_handler.current_focus;
    if (!current) return;
    const meta = this.media.get(current);
    if (!meta) return;

    const result = await this.os.dialog.pop_menu(
      "kate:media",
      "Media",
      [{ label: "Delete", value: "delete" as const }],
      "close"
    );
    switch (result) {
      case "delete": {
        if (
          await this.os.dialog.confirm("kate:media", {
            title: "Delete media?",
            message: "",
            ok: "Delete",
            cancel: "Keep media",
            dangerous: true,
          })
        ) {
          await this.os.capture.delete(meta.id!);
          await this.os.notifications.push("kate:media", `Media deleted`, "");
          await this.load_media();
        }
        break;
      }
      case "close": {
        break;
      }
      default:
        throw unreachable(result);
    }
  };

  handle_key_pressed = (key: ExtendedInputKey) => {
    switch (key) {
      case "x": {
        this.handle_close();
        return true;
      }

      case "o": {
        this.handle_view();
        return true;
      }

      case "menu": {
        this.handle_menu();
        return true;
      }
    }

    return false;
  };

  view = (x: typeof Db["media_store"]["__schema"]) => {
    const viewer = new SceneViewMedia(this.os, x);
    this.os.push_scene(viewer);
  };
}

export class SceneViewMedia extends Scene {
  private url: string | null = null;

  constructor(
    os: KateOS,
    readonly media: typeof Db["media_store"]["__schema"]
  ) {
    super(os);
  }

  render() {
    return h("div", { class: "kate-os-media-fullscreen" }, [
      h("div", { class: "kate-os-media-container" }, []),
      h("div", { class: "kate-os-statusbar visible" }, [
        UI.icon_button("menu", "Hide UI").on_clicked(this.handle_toggle_ui),
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
        UI.icon_button("o", "Download").on_clicked(this.handle_download),
      ]),
    ]);
  }

  async on_attached(): Promise<void> {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    const file = await this.media.file.getFile();
    const data = await file.arrayBuffer();
    const blob = new Blob([data], { type: file.type });
    this.url = URL.createObjectURL(blob);
    this.render_media(this.url);
  }

  render_media(url: string) {
    switch (this.media.mime) {
      case "image/png": {
        this.render_image(url);
        break;
      }

      case "video/webm": {
        this.render_video(url);
        break;
      }
    }
  }

  private get container(): HTMLElement {
    return this.canvas.querySelector(".kate-os-media-container")!;
  }

  render_image(url: string) {
    const img = h("img", { src: url, class: "kate-os-media-image" }, []);
    this.container.append(img);
  }

  render_video(url: string) {
    const player = h(
      "video",
      {
        controls: "controls",
        src: url,
        class: "kate-os-media-video",
        autoplay: "autoplay",
      },
      []
    );
    this.container.append(player);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    if (this.url != null) {
      URL.revokeObjectURL(this.url);
    }
  }

  handle_key_pressed = (key: ExtendedInputKey) => {
    switch (key) {
      case "x": {
        this.handle_close();
        return true;
      }

      case "o": {
        this.handle_download();
        return true;
      }

      case "menu": {
        this.handle_toggle_ui();
        return true;
      }
    }

    return false;
  };

  handle_toggle_ui = () => {
    const status = this.canvas.querySelector(".kate-os-statusbar")!;
    status.classList.toggle("visible");
  };

  handle_close = () => {
    this.os.pop_scene();
  };

  handle_download = () => {
    if (this.url == null) {
      return;
    }

    const extension = this.media.mime === "image/png" ? ".png" : ".webm";
    this.download_url(this.url, "kate-capture", extension);
  };

  async download_url(url: string, name: string, extension: string) {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = `${name}${this.timestamp_string()}${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  private timestamp_string() {
    const d = new Date();
    const f = (a: number) => String(a).padStart(2, "0");
    const date = `${d.getFullYear()}-${f(d.getMonth() + 1)}-${f(d.getDate())}`;
    const time = `${f(d.getHours())}-${f(d.getMinutes())}-${f(d.getSeconds())}`;
    return `${date}_${time}`;
  }
}
