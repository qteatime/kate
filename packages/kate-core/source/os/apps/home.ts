import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { ExtendedInputKey } from "../../kernel";
import * as Db from "../../data/db";
import { unreachable } from "../../utils";
import { Scene } from "../ui/scenes";
import { SceneApps } from "./applications";
import { SceneTextFile } from "./licence";
import { HUD_LoadIndicator } from "./load-screen";

export class SceneHome extends Scene {
  private cart_map = new Map<Element, Db.CartMeta>();

  render_cart(x: Db.CartMeta) {
    return new UI.Button([
      h("div", { class: "kate-os-carts-box" }, [
        h("div", { class: "kate-os-carts-image" }, [
          h("img", { src: x.thumbnail_dataurl }, []),
        ]),
        h("div", { class: "kate-os-carts-title" }, [x.metadata.game.title]),
      ]),
    ]).on_clicked(() => this.play(x.id));
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
        const child = this.render_cart(x.meta).render();
        this.cart_map.set(child, x.meta);
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

  async play(id: string) {
    await this.os.processes.run(id);
    await this.update_carts();
  }
}
