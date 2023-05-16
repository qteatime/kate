import {
  coarse_time,
  foldl,
  from_bytes,
  mb,
  relative_date,
} from "../../../utils";
import type { AppStorageDetails } from "../../apis/storage-manager";
import type { KateOS } from "../../os";
import * as UI from "../../ui";

export class SceneStorageSettings extends UI.SimpleScene {
  icon = "hard-drive";
  title = ["Storage"];

  async body() {
    const estimates = await this.os.storage_manager.estimate();
    const cartridges0 = Array.from(estimates.cartridges.values());
    const cartridges = cartridges0.sort((a, b) => {
      return b.usage.total_in_bytes - a.usage.total_in_bytes;
    });

    return [
      UI.section({
        title: `Storage summary (${from_bytes(estimates.totals.quota)})`,
        contents: [
          UI.stack_bar({
            total: estimates.totals.quota,
            minimum_component_size: 0.005,
            free: {
              title: "Free",
              display_value: from_bytes(
                estimates.totals.quota - estimates.totals.used
              ),
            },
            components: [
              {
                title: "System",
                value: estimates.totals.system,
                display_value: from_bytes(estimates.totals.system),
              },
              {
                title: "Media",
                value: estimates.totals.media,
                display_value: from_bytes(estimates.totals.media),
              },
              {
                title: "Cartridges",
                value: estimates.totals.applications,
                display_value: from_bytes(estimates.totals.applications),
              },
              {
                title: "Saves",
                value: estimates.totals.save_data,
                display_value: from_bytes(estimates.totals.save_data),
              },
            ],
          }),
        ],
      }),
      ...cartridges.map((x) => this.render_cartridge_summary(x)),
    ];
  }

  render_cartridge_summary(x: AppStorageDetails) {
    return UI.link_card(this.os, {
      icon: UI.image(x.icon_url),
      title: x.title,
      click_label: "Details",
      value: from_bytes(x.usage.total_in_bytes),
      description: `Last used: ${relative_date(
        x.dates.last_used
      )} | Last updated: ${relative_date(x.dates.last_modified)}`,
      on_click: () => {
        this.os.push_scene(new SceneCartridgeStorage(this.os, x));
      },
    });
  }
}

export class SceneCartridgeStorage extends UI.SimpleScene {
  icon = "hard-drive";
  get title() {
    return [this.app.title];
  }

  constructor(os: KateOS, readonly app: AppStorageDetails) {
    super(os);
  }

  body() {
    return [this.cartridge_summary(), UI.vspace(16), this.storage_summary()];
  }

  cartridge_summary() {
    return UI.hbox(0.5, [
      UI.mono_text([this.app.id]),
      UI.meta_text(["|"]),
      UI.mono_text([`v${this.app.version_id}`]),
      UI.meta_text(["|"]),
      UI.mono_text([`${this.app.status}`]),
    ]);
  }

  storage_summary() {
    return UI.section({
      title: `Storage summary (${from_bytes(this.app.usage.total_in_bytes)})`,
      contents: [
        UI.stack_bar({
          total: this.app.usage.total_in_bytes,
          minimum_component_size: 0.01,
          components: [
            component("Cartridges", this.app.usage.cartridge_size_in_bytes),
            component("Saves", this.app.usage.data.size_in_bytes),
            component("Media", this.app.usage.media.size_in_bytes),
          ],
        }),
      ],
    });
  }
}

function component(title: string, bytes: number) {
  return {
    title,
    value: bytes,
    display_value: from_bytes(bytes),
  };
}
