import type { KateOS } from "../os";
import { Widget, h, append, Widgetable } from "./widget";
import * as UI from "./widget";
import { ExtendedInputKey } from "../../kernel";
import * as Db from "../apis/db";

export abstract class Scene {
  readonly canvas: HTMLElement;
  constructor(protected os: KateOS) {
    this.canvas = h("div", { class: "kate-os-screen" }, []);
  }

  async attach(to: HTMLElement) {
    to.appendChild(this.canvas);
    this.canvas.innerHTML = "";
    append(this.render(), this.canvas);
  }

  async detach() {
    this.canvas.remove();
  }

  abstract render(): Widgetable;
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
      const cart_map = new Map<Element, typeof carts[0]>();
      for (const x of carts) {
        const child = this.render_cart(x).render();
        cart_map.set(child, x);
        list.appendChild(child);
      }
      this.os.focus_handler.focus(
        list.querySelector(".kate-ui-focus-target") ??
          (list.firstElementChild as HTMLElement) ??
          null
      );
      this.handle_key_pressed = async (key: ExtendedInputKey) => {
        switch (key) {
          case "menu": {
            for (const [button, cart] of cart_map) {
              if (button.classList.contains("focus")) {
                await this.show_pop_menu(cart);
                return;
              }
            }
          }
        }
      };
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
    }
  }

  render() {
    const home = h("div", { class: "kate-os-home" }, [
      new UI.Title_bar({
        left: UI.fragment([new UI.Section_title(["Library"])]),
      }),
      h("div", { class: "kate-os-carts-scroll" }, [
        h("div", { class: "kate-os-carts" }, []),
      ]),
    ]);

    const carts = home.querySelector(".kate-os-carts")! as HTMLElement;
    this.show_carts(carts);
    this.os.events.on_cart_inserted.listen(async (x) => {
      this.show_carts(carts);
    });
    this.os.events.on_cart_removed.listen(async () => {
      this.show_carts(carts);
    });
    this.os.kernel.console.on_key_pressed.listen((key) =>
      this.handle_key_pressed(key)
    );

    return home;
  }

  handle_key_pressed = (key: ExtendedInputKey) => {};
}
