import type { KateOS } from "../os";
import { Widget, h, append, Widgetable } from "./widget";
import * as UI from "./widget";
import { ExtendedInputKey } from "../../kernel";
import * as Db from "../apis/db";
import { unreachable } from "../../../../util/build";

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
        new UI.Button([
          new UI.HBox(5, [new UI.Icon("x"), "Return"]),
        ]).on_clicked(this.handle_close),
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
        this.os.pop_scene();
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
      console.log(error);
      this.os.notifications.push(
        "kate:os",
        "Failed to load games",
        `An internal error happened while loading.`
      );
    }
  }

  async show_pop_menu(cart: typeof Db["cart_meta"]["__schema"]) {
    const result = await this.os.dialog.pop_menu("kate:home", cart.title, [
      { label: "Play game", value: "play" as const },
      { label: "Legal notices", value: "legal" as const },
      { label: "Uninstall", value: "uninstall" as const },
      { label: "Return", value: "close" as const },
    ]);
    switch (result) {
      case "play": {
        this.os.processes.run(cart.id);
        break;
      }

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
    }
    return false;
  };
}
