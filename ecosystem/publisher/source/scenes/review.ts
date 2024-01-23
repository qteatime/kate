/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { CartridgeData, make_thumbnail, pick_thumbnail } from "../core/project";
import { UI, UIScene, Widgetable } from "../deps/appui";
import { Pathname, from_bytes } from "../deps/utils";

export class SceneReview extends UIScene {
  constructor(readonly ui: UI, readonly data: CartridgeData) {
    super(ui);
  }

  async render(): Promise<Widgetable> {
    const ui = this.ui.dsl;
    const config = this.data.config;
    const meta = config.metadata;
    const thumbnail_url = await pick_thumbnail(this.data.files, meta.presentation.thumbnail_path);

    return ui.app_screen({
      title: ui.title_bar({
        left: ui.title(["Review cartridge"]),
      }),
      body: ui
        .grid({
          content: {
            cart: ui.cartridge_thumbnail({ url: thumbnail_url, title: meta.presentation.title }),
            info: ui.scroll_area({}, [
              ui.stack([
                ui.mono_text([config.id]),
                ui.vspace(0.5),
                ui.strong([meta.presentation.title]),
                ui.meta_text([meta.presentation.tagline]),
                ui.meta_text(["version ", `${config.version.major}.${config.version.minor}`]),
                ui.vspace(1),
                ui.meta_text([
                  `${this.data.archive.length} files (${from_bytes(this.data.total_size)})`,
                ]),
              ]),
            ]),
            actions: ui.stack([
              ui.floating_button({
                label: "Save cartridge",
                on_click: () => {
                  this.save_cartridge();
                },
              }),
            ]),
          },
          layout: ["cart info", "cart actions"],
          column_sizes: ["200px", "1fr"],
          row_sizes: ["1fr", "64px"],
          gap: "1rem",
        })
        .fill()
        .style({ padding: "2rem 1rem 0 1rem" }),
      status: ui.status_bar([
        ui.dynamic_status_icons(),
        ui.keymap(this, {
          x: {
            label: "Return to home",
            action: () => {
              this.ui.pop_scene(this);
            },
          },
        }),
      ]),
    });
  }

  async save_cartridge() {
    KateAPI.browser.download_from_file(this.data.filename, this.data.cart);
  }
}
