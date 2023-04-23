import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import * as Db from "../../data";
import { unreachable } from "../../utils";
import { Action, SimpleScene } from "../ui/scenes";
import { SceneApps } from "./applications";
import { SceneTextFile } from "./text-file";
import { HUD_LoadIndicator } from "./load-screen";

export class SceneHome extends SimpleScene {
  icon = "diamond";
  title = ["Start"];
  subtitle = "Recently played and favourites";

  readonly actions: Action[] = [
    {
      key: ["ltrigger"],
      label: "Applications",
      handler: () => {
        this.os.push_scene(new SceneApps(this.os));
      },
    },
  ];

  private cart_map = new Map<Element, Db.CartMeta>();

  render_cart(x: Db.CartMeta) {
    return UI.interactive(
      this.os,
      h("div", { class: "kate-os-carts-box" }, [
        h("div", { class: "kate-os-carts-image" }, [
          h("img", { src: x.thumbnail_dataurl }, []),
        ]),
        h("div", { class: "kate-os-carts-title" }, [x.metadata.game.title]),
      ]),
      [
        {
          key: ["o"],
          on_click: true,
          label: "Play",
          handler: () => this.play(x.id),
        },
        {
          key: ["menu"],
          on_menu: true,
          label: "Options",
          handler: () => this.show_pop_menu(x),
        },
      ],
      {
        default_focus_indicator: false,
      }
    );
  }

  async show_carts(list: HTMLElement) {
    const recency = (x: { meta: Db.CartMeta; habits: Db.PlayHabits }) => {
      return Math.max(
        x.habits.last_played?.getTime() ?? 0,
        x.meta.updated_at.getTime()
      );
    };

    try {
      const carts = (await this.os.cart_manager.list()).sort(
        (a, b) => recency(b) - recency(a)
      );
      list.textContent = "";
      this.cart_map = new Map();
      for (const x of carts) {
        const child = this.render_cart(x.meta);
        this.cart_map.set(child, x.meta);
        list.appendChild(child);
      }
      this.os.focus_handler.focus(
        list.querySelector(".kate-ui-focus-target") ??
          (list.firstElementChild as HTMLElement) ??
          null
      );
      const qs = this.canvas.querySelector(
        ".kate-os-quickstart"
      ) as HTMLElement;
      qs.classList.toggle("hidden", carts.length !== 0);
    } catch (error) {
      console.error("[Kate] Failed to load cartridges", error);
      this.os.notifications.push(
        "kate:os",
        "Failed to load games",
        `An internal error happened while loading.`
      );
    }
  }

  async show_pop_menu(cart: Db.CartMeta) {
    const result = await this.os.dialog.pop_menu(
      "kate:home",
      cart.metadata.game.title,
      [
        { label: "Legal notices", value: "legal" as const },
        { label: "Uninstall", value: "uninstall" as const },
      ],
      "close"
    );
    switch (result) {
      case "uninstall": {
        const should_uninstall = await this.os.dialog.confirm("kate:home", {
          title: `Uninstall ${cart.metadata.game.title}?`,
          message: `This will remove the cartridge files, but not save data.`,
          cancel: "Keep game",
          ok: "Uninstall game",
          dangerous: true,
        });
        if (should_uninstall) {
          this.os.cart_manager.uninstall({
            id: cart.metadata.id,
            title: cart.metadata.game.title,
          });
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
          const legal = new SceneTextFile(
            this.os,
            `Legal Notices`,
            cart.metadata.game.title,
            cart.metadata.release.legal_notices
          );
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

  body_container(body: UI.Widgetable[]): HTMLElement {
    return h("div", { class: "kate-os-carts-scroll" }, [
      h("div", { class: "kate-os-carts" }, []),
      h("div", { class: "kate-os-quickstart hidden" }, [
        h("h2", { class: "kate-os-quickstart-title" }, ["No cartridges :("]),
        h("div", { class: "kate-os-quickstart-description" }, [
          "Drag and drop a ",
          h("tt", {}, [".kart"]),
          " file here ",
          "to install it.\n",
          "Or hold ",
          UI.icon("menu"),
          " (Menu) and choose ",
          h("tt", {}, ["Install Cartridge..."]),
        ]),
      ]),
    ]);
  }

  body() {
    return [];
  }

  on_attached() {
    super.on_attached();

    this.update_carts();
    this.os.events.on_cart_inserted.listen(this.update_carts);
    this.os.events.on_cart_removed.listen(this.update_carts);
  }

  on_detached() {
    this.os.events.on_cart_inserted.remove(this.update_carts);
    this.os.events.on_cart_removed.remove(this.update_carts);
    super.on_detached();
  }

  private update_carts = () => {
    const home = this.canvas!;
    const carts = home.querySelector(".kate-os-carts")! as HTMLElement;
    this.show_carts(carts);
  };

  async play(id: string) {
    await this.os.processes.run(id);
    await this.update_carts();
  }
}
