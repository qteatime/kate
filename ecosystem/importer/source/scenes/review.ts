/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { UI, UIScene, Widgetable } from "../deps/appui";
import { kart_v5 as Cart } from "../deps/schema";
import {
  Observable,
  load_image_from_bytes,
  make_thumbnail_from_bytes,
} from "../deps/utils";
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
        left: ui.title(["Review"]),
        right: ui.fragment([
          ui
            .stack([
              ui.strong(["Candidates"]),
              ui.page_bullet(current_index, {
                total: this.candidates.length,
                max_size: 6,
              }),
            ])
            .style({ "align-items": "right" }),

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
                ui
                  .class("kate-os-carts-box", [
                    ui.class("kate-os-carts-image", [
                      x.thumbnail == null
                        ? ui.class("kate-no-thumbnail", [x.title])
                        : load_image_from_bytes("image/png", x.thumbnail),
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
                      ui.class("imp-floating-edit-button", [
                        ui.fa_icon("pencil"),
                      ]),
                    ]),
                  ])
                  .interactive([
                    {
                      key: ["o"],
                      on_click: true,
                      label: "Change thumbnail",
                      handler: async () => {
                        await this.select_thumbnail(current_index, x);
                      },
                    },
                  ]),
              ]),

              ui.class("imp-review-details", [
                ui.class("imp-review-form", [
                  ui.meta_text([x.engine]),

                  ui.field("Name", [
                    ui.text_input(x.title, {
                      query: "Enter a title for the cartridge:",
                      on_change: (title) => {
                        x.title = title ?? "(Untitled)";
                        current_index.value = current_index.value;
                      },
                    }),
                  ]),
                ]),
              ]),
            ]),
            ui.floating_button({
              label: "Install",
              icon: ui.fa_icon("download"),
              on_click: () => {
                this.import(x);
              },
            }),
          ]);
        })
      ),
      status: ui.status_bar([
        ui.status_icon(["l", "r"], "Select candidate"),
        ui.status_icon(["cancel"], "Return"),
      ]),
    });
  }

  async select_thumbnail(current: Observable<number>, candidate: Importer) {
    const files = await KateAPI.device_files.request_file({
      strict: true,
      types: [
        { type: "image/*", extensions: [".jpg", ".jpeg", ".png", ".webp"] },
      ],
    });
    if (files.length !== 1) {
      return;
    }
    const [file] = files;
    const image = await file.read();
    const thumbnail_url = await make_thumbnail_from_bytes(
      400,
      700,
      "image/png",
      image
    );
    const bytes = new Uint8Array(
      await (await fetch(thumbnail_url)).arrayBuffer()
    );
    candidate.thumbnail = bytes;
    current.value = current.value;
  }

  async next(index: Observable<number>) {
    if (index.value + 1 < this.candidates.length) {
      index.value = index.value + 1;
    } else {
    }
  }

  async import(candidate: Importer) {
    try {
      await this.ui.dialogs.progress({
        message: ["Preparing cartridge..."],
        process: async (progress) => {
          const cartridge = await candidate.make_cartridge();
          progress.set_message(["Packing cartridge..."]);
          const bytes = Cart.encode({
            kate_version: Cart.Kate_version({ major: 0, minor: 29, patch: 1 }),
            metadata: cartridge.metadata,
            files: cartridge.files,
          });
          progress.set_message(["Preparing to install..."]);
          await KateAPI.cart_manager.install(bytes);
        },
      });
    } catch (e) {
      console.error(`Failed to import:`, e);
      await this.ui.dialogs.message({
        message: [
          "Failed to prepare cartridge for installation: unknown internal error",
        ],
      });
    }
  }
}
