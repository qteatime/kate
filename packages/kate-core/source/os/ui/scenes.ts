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
        left: UI.fragment([
          UI.fa_icon("circle-info", "lg"),
          new UI.Section_title(["Legal notices"]),
        ]),
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
        left: UI.fragment([
          UI.fa_icon("diamond", "lg"),
          new UI.Section_title(["Start"]),
        ]),
        right: "Recently played and favourites",
      }),
      h("div", { class: "kate-os-carts-scroll" }, [
        h("div", { class: "kate-os-carts" }, []),
      ]),
      UI.status_bar([
        UI.icon_button("ltrigger", "Applications").on_clicked(
          this.handle_applications
        ),
        UI.icon_button("menu", "Options").on_clicked(this.handle_options),
        UI.icon_button("o", "Play").on_clicked(this.handle_play),
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
        this.handle_options();
        return true;
      }

      case "ltrigger": {
        this.handle_applications();
        return true;
      }
    }
    return false;
  };

  handle_options = () => {
    for (const [button, cart] of this.cart_map) {
      if (button.classList.contains("focus")) {
        this.show_pop_menu(cart);
        return;
      }
    }
  };

  handle_play = () => {
    const current = this.os.focus_handler.current_focus;
    if (current != null) {
      current.click();
    }
  };

  handle_applications = () => {
    const apps = new SceneApps(this.os);
    this.os.push_scene(apps);
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
        left: UI.fragment([
          UI.fa_icon("images", "lg"),
          new UI.Section_title(["Media gallery"]),
        ]),
        right: h("div", { class: "kate-os-media-status" }, []),
      }),
      h("div", { class: "kate-os-scroll" }, [
        h("div", { class: "kate-os-media-items" }, []),
      ]),
      h("div", { class: "kate-os-statusbar" }, [
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
        this.format_duration(duration),
      ]);
    }
  }

  private format_duration(n0: number) {
    const units = [
      [60, "mins"],
      [60, "hours"],
    ] as const;
    let n = n0;
    let unit = "secs";
    for (const [span, new_unit] of units) {
      if (n >= span) {
        n = n / span;
        unit = new_unit;
      } else {
        break;
      }
    }
    return `${Math.round(n)} ${unit}`;
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
    }

    return false;
  };

  view = (x: typeof Db["media_store"]["__schema"]) => {
    const viewer = new SceneViewMedia(this.os, this, x);
    this.os.push_scene(viewer);
  };

  mark_deleted = (id: number) => {
    for (const [button, meta] of this.media) {
      if (meta.id === id) {
        if (button.classList.contains("focus")) {
          const new_focus =
            button.previousElementSibling ?? button.nextElementSibling ?? null;
          this.os.focus_handler.focus(new_focus as HTMLElement | null);
          button.remove();
          this.media.delete(button);
        }
        break;
      }
    }
  };
}

export class SceneViewMedia extends Scene {
  private url: string | null = null;

  constructor(
    os: KateOS,
    readonly media_list: SceneMedia,
    readonly media: typeof Db["media_store"]["__schema"]
  ) {
    super(os);
  }

  render() {
    return h("div", { class: "kate-os-media-fullscreen" }, [
      h("div", { class: "kate-os-media-container" }, []),
      h("div", { class: "kate-os-statusbar visible" }, [
        UI.icon_button("menu", "Options").on_clicked(this.handle_options),
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
        this.media_type === "video"
          ? UI.icon_button("o", "Play/Pause").on_clicked(this.handle_play_pause)
          : null,
      ]),
    ]);
  }

  get media_type() {
    switch (this.media.mime) {
      case "image/png":
        return "image";
      case "video/webm":
        return "video";
      default:
        return "unknown";
    }
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
    switch (this.media_type) {
      case "image": {
        this.render_image(url);
        break;
      }

      case "video": {
        this.render_video(url);
        break;
      }

      default:
        return null;
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
        src: url,
        class: "kate-os-media-video",
        autoplay: "autoplay",
        loop: "loop",
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
        this.handle_play_pause();
        return true;
      }

      case "menu": {
        this.handle_options();
        return true;
      }
    }

    return false;
  };

  handle_play_pause = () => {
    const video = this.canvas.querySelector("video");
    if (video != null) {
      if (video.paused || video.ended) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  handle_toggle_ui = () => {
    const status = this.canvas.querySelector(".kate-os-statusbar")!;
    status.classList.toggle("visible");
  };

  handle_options = async () => {
    const ui = this.canvas.querySelector(".kate-os-statusbar")!;
    const ui_visible = ui.classList.contains("visible");
    const result = await this.os.dialog.pop_menu(
      "kate:media",
      "",
      [
        { label: "Delete", value: "delete" as const },
        {
          label: `${ui_visible ? "Hide" : "Show"} UI`,
          value: "toggle-ui" as const,
        },
        { label: "Download", value: "download" as const },
      ],
      "close"
    );
    switch (result) {
      case "toggle-ui": {
        this.handle_toggle_ui();
        break;
      }

      case "close": {
        break;
      }

      case "delete": {
        this.handle_delete();
        break;
      }

      case "download": {
        this.handle_download();
        break;
      }

      default:
        throw unreachable(result);
    }
  };

  handle_delete = async () => {
    const should_delete = await this.os.dialog.confirm("kate:media", {
      title: "",
      message: "Delete this file? This is an irreversible operation.",
      ok: "Delete",
      cancel: "Keep file",
      dangerous: true,
    });
    if (should_delete) {
      await this.os.capture.delete(this.media.id!);
      await this.os.notifications.push("kate:media", `Media deleted`, "");
      this.media_list.mark_deleted(this.media.id!);
      this.os.pop_scene();
    }
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

export class SceneApps extends Scene {
  readonly apps = [
    {
      name: "media",
      title: "Media gallery",
      icon: UI.fa_icon("images"),
      open: () => new SceneMedia(this.os, null),
    },
  ] as const;

  render() {
    return h("div", { class: "kate-os-simple-screen" }, [
      new UI.Title_bar({
        left: UI.fragment([
          UI.fa_icon("puzzle-piece", "lg"),
          new UI.Section_title(["Applications"]),
        ]),
      }),
      h("div", { class: "kate-os-scroll" }, [
        h("div", { class: "kate-os-applications" }, [
          ...this.apps.map((x) => this.render_app(x)),
        ]),
      ]),
      h("div", { class: "kate-os-statusbar" }, [
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
        UI.icon_button("o", "Open").on_clicked(this.handle_open),
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
    switch (key) {
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

  handle_open = () => {
    const current = this.os.focus_handler.current_focus;
    if (current != null) {
      current.click();
    }
  };

  render_app(app: typeof this["apps"][0]) {
    return new UI.Button([
      h("div", { class: "kate-os-app-button" }, [
        h("div", { class: "kate-os-app-button-icon" }, [app.icon]),
        h("div", { class: "kate-os-app-button-title" }, [app.title]),
      ]),
    ]).on_clicked(() => this.open_app(app));
  }

  open_app(app: typeof this["apps"][0]) {
    const screen = app.open();
    this.os.push_scene(screen);
  }
}
