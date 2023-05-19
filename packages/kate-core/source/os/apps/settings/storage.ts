import {
  coarse_time,
  foldl,
  from_bytes,
  mb,
  relative_date,
} from "../../../utils";
import type { AppStorageDetails } from "../../apis/storage-manager";
import type { CartChangeReason, KateOS } from "../../os";
import * as UI from "../../ui";
import { SceneMedia } from "../media";

export class SceneStorageSettings extends UI.SimpleScene {
  icon = "hard-drive";
  title = ["Storage"];

  on_attached(): void {
    super.on_attached();
    this.os.events.on_cart_changed.listen(this.reload);
  }

  on_detached(): void {
    this.os.events.on_cart_changed.remove(this.reload);
    super.on_detached();
  }

  reload = async (x: { id: string; reason: CartChangeReason }) => {
    const body = await this.body();
    const container = this.canvas.querySelector(".kate-os-screen-body")!;
    container.textContent = "";
    container.append(UI.fragment(body));
  };

  async body() {
    const estimates = await this.os.storage_manager.estimate();
    const cartridges0 = Array.from(estimates.cartridges.values());
    const cartridges = cartridges0.sort((a, b) => {
      return b.usage.total_in_bytes - a.usage.total_in_bytes;
    });
    const used_total = estimates.totals.used;

    return [
      UI.section({
        title: `Storage summary (${from_bytes(
          estimates.totals.quota ?? used_total
        )})`,
        contents: [
          UI.stack_bar({
            total: estimates.totals.quota ?? used_total,
            minimum_component_size: 0.005,
            free:
              estimates.totals.quota != null
                ? {
                    title: "Free",
                    display_value: from_bytes(
                      estimates.totals.quota - estimates.totals.used
                    ),
                  }
                : undefined,
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
        this.os.push_scene(new SceneCartridgeStorageSettings(this.os, x));
      },
    });
  }
}

export class SceneCartridgeStorageSettings extends UI.SimpleScene {
  icon = "hard-drive";
  get title() {
    return [this.app.title];
  }

  on_attached(): void {
    super.on_attached();
    this.os.events.on_cart_changed.listen(this.reload);
  }

  on_detached(): void {
    this.os.events.on_cart_changed.remove(this.reload);
    super.on_detached();
  }

  reload = async (x: { id: string }) => {
    if (x.id !== this.app.id) {
      return;
    }

    const app = await this.os.storage_manager.try_estimate_cartridge(
      this.app.id
    );
    let body: UI.Widgetable[];
    if (app != null) {
      this.app = app;
      body = this.body();
    } else {
      this.app = { ...this.app, status: "inactive" };
      body = [cartridge_summary(this.app, "deleted")];
    }
    const container = this.canvas.querySelector(".kate-os-screen-body")!;
    container.textContent = "";
    container.append(UI.fragment(body));
  };

  constructor(os: KateOS, private app: AppStorageDetails) {
    super(os);
  }

  body() {
    return [
      cartridge_summary(this.app),
      UI.vspace(16),
      UI.focusable_container([this.storage_summary()]),
      UI.vspace(16),
      UI.link_card(this.os, {
        icon: "images",
        title: "Manage videos and screenshots",
        description: `${this.app.usage.media.count} files (${from_bytes(
          this.app.usage.media.size_in_bytes
        )})`,
        click_label: "Manage",
        on_click: () => {
          this.os.push_scene(
            new SceneMedia(this.os, { id: this.app.id, title: this.app.title })
          );
        },
      }),
      UI.link_card(this.os, {
        icon: "hard-drive",
        title: "Manage save data",
        description: `${from_bytes(
          this.app.usage.data.size_in_bytes +
            this.app.usage.shared_data.size_in_bytes
        )}`,
        click_label: "Manage",
        on_click: () => {
          this.os.push_scene(
            new SceneCartridgeSaveDataSettings(this.os, this.app)
          );
        },
      }),
      UI.when(this.os.kernel.console.options.mode !== "single", [
        UI.vspace(32),
        this.data_actions(),
      ]),
    ];
  }

  data_actions() {
    return UI.section({
      title: "Actions",
      contents: [
        UI.when(!this.os.processes.is_running(this.app.id), [
          UI.meta_text([
            `Here you can remove the cartridge files to free up space.
             If you want to delete only save data, or only captured media,
             you can do it from one of the screens above.`,
          ]),
        ]),
        UI.when(this.os.processes.is_running(this.app.id), [
          UI.meta_text([
            `
            The cartridge is currently running. To manage this cartridge's
            data you'll need to close the cartridge first.
          `,
          ]),
        ]),
        UI.when(
          this.app.status === "active" &&
            !this.os.processes.is_running(this.app.id),
          [
            UI.vspace(16),
            UI.button_panel(this.os, {
              title: "Archive cartridge",
              description: `Cartridge files will be deleted, save data and media will be kept.
                            Reinstalling the cartridge will bring it back to the current state`,
              dangerous: true,
              on_click: () => this.archive_cartridge(),
            }),
          ]
        ),
        UI.when(
          this.app.status !== "inactive" &&
            !this.os.processes.is_running(this.app.id),
          [
            UI.vspace(16),
            UI.button_panel(this.os, {
              title: "Delete all data",
              description: `Cartridge files and save data will be deleted, media will be kept.
                            Reinstalling will not restore the save data.`,
              dangerous: true,
              on_click: () => this.delete_all_data(),
            }),
          ]
        ),
      ],
    });
  }

  async archive_cartridge() {
    const ok = await this.os.dialog.confirm("kate:settings", {
      title: `Archive ${this.app.title}?`,
      message: `This will delete all cartridge files for it, and hide the
                cartridge from the Start screen. Save data and media
                will be kept, and you can re-install the cartridge
                later to play it again.`,
      dangerous: true,
      cancel: "Cancel",
      ok: "Archive cartridge",
    });
    if (ok) {
      await this.os.cart_manager.archive(this.app.id);
      await this.os.notifications.push(
        "kate:settings",
        "Archived cartridge",
        `Archived ${this.app.id} v${this.app.version_id}`
      );
    }
  }

  async delete_all_data() {
    const ok = await this.os.dialog.confirm("kate:settings", {
      title: `Delete ${this.app.title}?`,
      message: `This will delete all cartridge files and save data. This is
                an irreversible operation; save data cannot be restored.
                Media files will not be removed.`,
      dangerous: true,
      cancel: "Cancel",
      ok: "Delete all cartridge data",
    });
    if (ok) {
      await this.os.cart_manager.delete_all_data(this.app.id);
      await this.os.notifications.push(
        "kate:settings",
        "Deleted cartridge",
        `Deleted ${this.app.id} v${this.app.version_id}`
      );
    }
  }

  storage_summary() {
    return UI.section({
      title: `Storage summary (${from_bytes(this.app.usage.total_in_bytes)})`,
      contents: [
        UI.stack_bar({
          total: this.app.usage.total_in_bytes,
          minimum_component_size: 0.01,
          components: [
            component("Cartridge", this.app.usage.cartridge_size_in_bytes),
            component(
              "Saves",
              this.app.usage.data.size_in_bytes +
                this.app.usage.shared_data.size_in_bytes
            ),
            component("Media", this.app.usage.media.size_in_bytes),
          ],
        }),
      ],
    });
  }
}

class SceneCartridgeSaveDataSettings extends UI.SimpleScene {
  icon = "hard-drive";
  get title() {
    return [this.app.title];
  }

  on_attached(): void {
    super.on_attached();
    this.os.events.on_cart_changed.listen(this.reload);
  }

  on_detached(): void {
    this.os.events.on_cart_changed.remove(this.reload);
    super.on_detached();
  }

  reload = async (x: { id: string }) => {
    if (x.id !== this.app.id) {
      return;
    }

    const app = await this.os.storage_manager.try_estimate_cartridge(
      this.app.id
    );
    let body: UI.Widgetable[];
    if (app != null) {
      this.app = app;
      body = this.body();
    } else {
      this.app = { ...this.app, status: "inactive" };
      body = [cartridge_summary(this.app, "deleted")];
    }
    const container = this.canvas.querySelector(".kate-os-screen-body")!;
    container.textContent = "";
    container.append(UI.fragment(body));
  };

  constructor(os: KateOS, private app: AppStorageDetails) {
    super(os);
  }

  body() {
    return [
      cartridge_summary(this.app),
      UI.vspace(16),
      this.save_data_summary(),
      UI.vspace(32),
      UI.button_panel(this.os, {
        title: "Delete all save data",
        description: [
          `The cartridge will work as a freshly installed one after this.`,
          this.os.processes.is_running(this.app.id)
            ? " The cartridge is running, so it will be restarted."
            : "",
        ].join(""),
        on_click: () => this.delete_save_data(),
        dangerous: true,
      }),
    ];
  }

  save_data_summary() {
    return UI.section({
      title: `Summary`,
      contents: [
        UI.focusable_container([
          UI.strong([`Specific to this version (${this.app.version_id})`]),
          UI.vspace(4),
          UI.stack_bar({
            total: this.app.quota.data.size_in_bytes,
            skip_zero_value: false,
            free: {
              title: "Free",
              display_value: from_bytes(
                this.app.quota.data.size_in_bytes -
                  this.app.usage.data.size_in_bytes
              ),
            },
            components: [
              component("In use", this.app.usage.data.size_in_bytes),
            ],
          }),
        ]),
        UI.vspace(16),
        UI.focusable_container([
          UI.strong(["Shared by all versions"]),
          UI.vspace(4),
          UI.stack_bar({
            total: this.app.quota.shared_data.size_in_bytes,
            skip_zero_value: false,
            free: {
              title: "Free",
              display_value: from_bytes(
                this.app.quota.shared_data.size_in_bytes -
                  this.app.usage.shared_data.size_in_bytes
              ),
            },
            components: [
              component("In use", this.app.usage.shared_data.size_in_bytes),
            ],
          }),
        ]),
      ],
    });
  }

  async delete_save_data() {
    const ok = await this.os.dialog.confirm("kate:settings", {
      title: `Delete save data for ${this.app.title}?`,
      message: `This will remove all save data for the cartridge. Save data
                cannot be recovered.`,
      dangerous: true,
      cancel: "Cancel",
      ok: "Delete save data",
    });
    if (ok) {
      await this.os.processes.terminate(
        this.app.id,
        "kate:settings",
        "Deleted save data."
      );
      await this.os.object_store.delete_cartridge_data(
        this.app.id,
        this.app.version_id
      );
      await this.os.notifications.push(
        "kate:settings",
        "Deleted save data",
        `Deleted save data for ${this.app.title}`
      );
      if (this.os.kernel.console.options.mode === "single") {
        location.reload();
      }
    }
  }
}

function cartridge_summary(app: AppStorageDetails, override_status?: string) {
  return UI.hbox(0.5, [
    UI.mono_text([app.id]),
    UI.meta_text(["|"]),
    UI.mono_text([`v${app.version_id}`]),
    UI.meta_text(["|"]),
    UI.mono_text([`${override_status ?? app.status}`]),
  ]);
}

function component(title: string, bytes: number) {
  return {
    title,
    value: bytes,
    display_value: from_bytes(bytes),
  };
}
