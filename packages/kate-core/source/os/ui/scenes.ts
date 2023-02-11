import type { KateOS } from "../os";
import { Widget, h, append, Widgetable } from "./widget";
import * as UI from "./widget";

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
      for (const x of carts) {
        list.appendChild(this.render_cart(x).render());
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

    return home;
  }
}
