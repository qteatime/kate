import { UI, UIScene, Widgetable } from "../deps/appui";
import { Cart } from "../deps/schema";
import { Observable } from "../deps/utils";
import { Importer } from "../importers";
import { SceneProgress } from "./progress";

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
        left: ui.title([
          "Kate Importer",
          ui.fa_icon("caret-right").style({ margin: "0 0.5em" }),
          "Review",
        ]),
        right: ui.fragment([
          ui.dynamic(
            current_index.map<Widgetable>(
              (x) => `${x + 1} of ${this.candidates.length}`
            )
          ),

          ui.keymap(this, {
            ltrigger: {
              label: "Previous",
              action: () => {
                if (current_index.value > 0) {
                  current_index.value = current_index.value - 1;
                }
              },
            },
            rtrigger: {
              label: "Next",
              action: () => {
                if (current_index.value + 1 < this.candidates.length) {
                  current_index.value = current_index.value + 1;
                }
              },
            },
            x: {
              label: "Return to home",
              action: () => {
                this.ui.pop_scene(this);
              },
            },
          }),
        ]),
      }),
      body: ui.dynamic(
        current.map<Widgetable>((x) => {
          return ui.fragment([
            ui.class("imp-review-container", [
              ui.class("imp-review-thumbnail", [
                ui.class("kate-os-carts-box", [
                  ui.class("kate-os-carts-image", [
                    ui.class("kate-no-thumbnail", [x.title]),
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
                      {
                        class: "kate-os-carts-rating",
                        "data-rating": "unknown",
                      },
                      ["—"]
                    ),
                  ]),
                ]),
              ]),

              ui.class("imp-review-details", [
                ui.class("imp-review-form", [
                  ui.meta_text([x.engine]),

                  ui.field("Name", [ui.text_input(x.title, {})]),
                ]),
                ui.action_buttons([
                  ui.text_button("Save cartridge", () => {
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

  async next(index: Observable<number>) {
    if (index.value + 1 < this.candidates.length) {
      index.value = index.value + 1;
    } else {
    }
  }

  async import(candidate: Importer) {
    const progress = SceneProgress.show(this.ui)
      .set_message("Preparing cartridge...")
      .set_unknown_progress();
    try {
      const cartridge = await candidate.make_cartridge();
      progress.set_message("Packing cartridge...");
      const bytes = Cart.encode(cartridge);
      progress.close();
      await KateAPI.cart_manager.install(bytes);
    } catch (e) {
      progress.close();
      console.error(`Failed to import:`, e);
    }
  }
}
