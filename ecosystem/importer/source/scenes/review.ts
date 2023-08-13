import { UI, UIScene, Widgetable } from "../deps/appui";
import { Cart } from "../deps/schema";
import { Observable } from "../deps/utils";
import { Importer } from "../importers";

export class SceneReview extends UIScene {
  constructor(ui: UI, readonly candidates: Importer[]) {
    super(ui);
  }

  render(): Widgetable {
    const ui = this.ui.dsl;
    const current_index = new Observable(0);
    const current = current_index.map((x) => this.candidates[x]);

    return ui.app_screen({
      title: ui.title_bar({
        left: ui.title(["Review cartridges"]),
      }),
      body: ui.dynamic(
        current.map<Widgetable>((x) => {
          return ui.fragment([
            ui.class("kate-ui-review-container", [
              ui.class("kate-ui-review-thumbnail", [
                ui.class("kate-os-carts-box", [
                  ui.class("kate-os-carts-image", [
                    ui.class("kate-no-thumbnail", [x.title]),
                  ]),
                  ui.h(
                    "div",
                    {
                      class: "kate-os-carts-release-type",
                      "data-release-type": "unofficial",
                    },
                    ["Unofficial"]
                  ),
                  ui.h(
                    "div",
                    { class: "kate-os-carts-rating", "data-rating": "unknown" },
                    ["—"]
                  ),
                ]),
              ]),

              ui.vbox({ gap: 1 }, [
                ui.meta_text([x.engine]),

                ui.field("Name", [ui.text_input(x.title, {})]),

                ui.action_buttons([
                  ui.text_button("Import cartridge", () => {
                    this.import(x);
                  }),
                ]),
              ]),
            ]),
          ]);
        })
      ),
    });
  }

  async import(candidate: Importer) {
    const cartridge = await candidate.make_cartridge();
    const bytes = Cart.encode(cartridge);
    await KateAPI.cart_manager.install(bytes);
  }
}
