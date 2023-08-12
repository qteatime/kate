import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import * as Db from "../../data";
import { serialise_error, unreachable } from "../../utils";
import { Action, SimpleScene } from "../ui/scenes";
import { SceneTextFile } from "./text-file";
import { HUD_LoadIndicator } from "./load-screen";
import { SceneCartridgeStorageSettings } from "./settings/storage";
import { Cart, ContentRating, ReleaseType } from "../../cart";
import { SceneCartridgePermissions } from "./settings/permissions";

export class SceneHome extends SimpleScene {
  icon = "diamond";
  title = ["Start"];
  subtitle = "Recently played and favourites";

  readonly actions: Action[] = [];

  private cart_map = new Map<Element, Db.CartMeta>();

  render_cart(x: Db.CartMeta) {
    return UI.interactive(
      this.os,
      h("div", { class: "kate-os-carts-box" }, [
        h("div", { class: "kate-os-carts-image" }, [
          x.thumbnail_dataurl
            ? h("img", { src: x.thumbnail_dataurl }, [])
            : UI.no_thumbnail(x.metadata.presentation.title),
          h(
            "div",
            {
              class: "kate-os-carts-release-type",
              "data-release-type": x.metadata.presentation.release_type,
            },
            [pretty_release_type(x.metadata.presentation.release_type)]
          ),
          h(
            "div",
            {
              class: "kate-os-carts-rating",
              "data-rating": x.metadata.classification.rating,
            },
            [rating_icon(x.metadata.classification.rating)]
          ),
        ]),
        h("div", { class: "kate-os-carts-title" }, [
          x.metadata.presentation.title,
        ]),
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
    const recency = (
      cart: Db.CartMeta,
      habits_map: Map<string, Db.PlayHabits>
    ) => {
      const habits = habits_map.get(cart.id);
      return Math.max(
        habits?.last_played?.getTime() ?? 0,
        cart.updated_at.getTime()
      );
    };

    try {
      const carts0 = await this.os.cart_manager.list_by_status("active");
      const habits = await this.os.play_habits.try_get_all(
        carts0.map((x) => x.id)
      );
      const carts = carts0.sort(
        (a, b) => recency(b, habits) - recency(a, habits)
      );
      list.textContent = "";
      this.cart_map = new Map();
      for (const x of carts) {
        const child = this.render_cart(x);
        this.cart_map.set(child, x);
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
      this.os.audit_supervisor.log("kate:home", {
        resources: ["kate:cartridge", "error"],
        risk: "high",
        type: "kate.home.load-failed",
        message: `Failed to load games: internal error`,
        extra: { error: serialise_error(error) },
      });
      this.os.notifications.push_transient(
        "kate:home",
        "Failed to load games",
        `An internal error happened while loading.`
      );
    }
  }

  async show_pop_menu(cart: Db.CartMeta) {
    const result = await this.os.dialog.pop_menu(
      "kate:home",
      cart.metadata.presentation.title,
      [
        ...(cart.metadata.legal.licence_path != null
          ? [{ label: "Legal notices", value: "legal" as const }]
          : []),
        ...(cart.metadata.legal.privacy_policy_path != null
          ? [{ label: "Privacy policy", value: "privacy" as const }]
          : []),
        { label: "Storage usage", value: "manage-data" as const },
        { label: "Permissions", value: "permissions" as const },
      ],
      "close"
    );
    switch (result) {
      case "manage-data": {
        const app = await this.os.storage_manager.try_estimate_cartridge(
          cart.id
        );
        if (app != null) {
          this.os.push_scene(new SceneCartridgeStorageSettings(this.os, app));
        } else {
          await this.os.dialog.message("kate:home", {
            title: "Failed to read cartridge",
            message:
              "An unknown error happened while reading the cartridge details.",
          });
        }
        break;
      }

      case "permissions": {
        this.os.push_scene(new SceneCartridgePermissions(this.os, cart));
        break;
      }

      case "close": {
        break;
      }

      case "legal": {
        this.show_legal_notice(
          "Legal notices",
          cart,
          cart.metadata.legal.licence_path
        );
        break;
      }

      case "privacy": {
        this.show_legal_notice(
          "Privacy policy",
          cart,
          cart.metadata.legal.privacy_policy_path
        );
        break;
      }

      default: {
        throw unreachable(result);
      }
    }
  }

  private async show_legal_notice(
    title: string,
    cart: Db.CartMeta,
    path: string | null
  ) {
    if (path == null) {
      return;
    }
    const licence_file = await this.os.cart_manager.read_file_by_path(
      cart.id,
      path
    );
    const decoder = new TextDecoder();
    const licence = decoder.decode(licence_file.data);
    const legal = new SceneTextFile(
      this.os,
      title,
      cart.metadata.presentation.title,
      licence
    );
    this.os.push_scene(legal);
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
    this.os.events.on_cart_changed.listen(this.update_carts);
  }

  on_detached() {
    this.os.events.on_cart_changed.remove(this.update_carts);
    super.on_detached();
  }

  private update_carts = async () => {
    const home = this.canvas!;
    const carts = home.querySelector(".kate-os-carts")! as HTMLElement;
    await this.show_carts(carts);
  };

  async play(id: string) {
    await this.os.processes.run(id);
    await this.update_carts();
  }
}

function pretty_release_type(x: ReleaseType) {
  switch (x) {
    case "beta":
      return "Beta";
    case "demo":
      return "Demo";
    case "early-access":
      return "Dev.";
    case "prototype":
      return "PoC";
    case "regular":
      return "Full";
    default:
      throw unreachable(x, "release type");
  }
}

function rating_icon(x: ContentRating) {
  switch (x) {
    case "general":
      return "G";
    case "teen-and-up":
      return "T";
    case "mature":
      return "M";
    case "explicit":
      return "E";
    case "unknown":
      return "—";
    default:
      throw unreachable(x, "content rating");
  }
}
