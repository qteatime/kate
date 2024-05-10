/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import * as UI from "../../ui";

export class SceneRecovery extends UI.SimpleScene {
  readonly application_id = "kate:settings:recovery";
  icon = "stethoscope";
  title = ["Diagnostics & Recovery"];

  body() {
    return [
      UI.p([
        `
        If you're having issues with the Kate emulator, resetting the emulator might help.
      `,
      ]),
      UI.vspace(16),

      UI.when(
        this.os.kernel.console.options.mode === "web" && this.os.app_resources.worker != null,
        [
          UI.button_panel(this.os, {
            title: "Refresh cache",
            description:
              "Update all cached resources to the current version. The application will reload afterwards.",
            on_click: this.refresh_cache,
            dangerous: false,
          }),
        ]
      ),

      UI.when(this.os.app_resources.has_update != null, [
        UI.button_panel(this.os, {
          title: `Force-update to v${this.os.app_resources.has_update}`,
          description: "Force-update Kate to the version above. The application will reload.",
          on_click: this.force_update,
          dangerous: false,
        }),
      ]),
      UI.vdivider(),

      UI.button_panel(this.os, {
        title: "Restore default settings",
        description: "Switch all settings back to the default ones.",
        on_click: this.restore_default_settings,
        dangerous: true,
      }),
      UI.vdivider(),

      UI.button_panel(this.os, {
        title: "Delete all data",
        description: `Delete ALL data locally stored in the console. The application will reload
          afterwards.`,
        on_click: this.delete_all_data,
        dangerous: true,
      }),
    ];
  }

  restore_default_settings = async () => {
    const should_reset = await this.os.dialog.confirm("kate:recovery", {
      title: "Restore to default settings?",
      message: `This will remove all of your custom configuration and reset Kate to
       its original configuration. The operation is irreversible.`,
      dangerous: true,
      cancel: "Keep my configuration",
      ok: "Reset to defaults",
    });
    if (!should_reset) {
      return;
    }

    await this.os.dialog.progress(
      "kate:recovery",
      "Restoring default settings",
      async (progress) => {
        await this.os.settings.reset_to_defaults();
      }
    );
    await this.os.dialog.message("kate:recovery", {
      title: "",
      message: "All settings reverted to defaults.",
    });
  };

  force_update = async () => {
    const updated = await this.os.app_resources.force_update();
    if (!updated) {
      await this.os.dialog.message("kate:recovery", {
        title: "Failed to update",
        message: "Could not update the application",
      });
      return;
    } else {
      location.reload();
    }
  };

  refresh_cache = async () => {
    try {
      await this.os.dialog.progress("kate:recovery", "Refreshing cache", async (progress) => {
        await this.os.app_resources.refresh_cache();
      });
      location.reload();
    } catch (error) {
      console.error(`[Kate] failed to refresh cache:`, error);
      await this.os.dialog.message("kate:recovery", {
        title: "Failed to refresh cache",
        message: `Kate's cache could not be refreshed.`,
      });
    }
  };

  delete_all_data = async () => {
    const should_delete = await this.os.dialog.confirm("kate:recovery", {
      title: "Remove all console data?",
      message: `This will delete all data stored in the console, including
      cartridge files, save data, screenshots, and settings. When Kate reloads
      it'll be as if you were running it for the first time. This is an
      irreversible operation.`,
      dangerous: true,
      cancel: "Keep my data",
      ok: "Delete all data",
    });
    if (!should_delete) {
      return;
    }

    try {
      await this.os.dialog.progress(
        "kate:recovery",
        "Removing all console data",
        async (progress) => {
          await this.os.db.delete_database();
          delete localStorage["kate-version"];
          delete localStorage["kate-channel"];
        }
      );
      location.reload();
    } catch (error) {
      console.error(`[Kate] failed to factory reset:`, error);
      await this.os.dialog.message("kate:recovery", {
        title: "Failed to remove data",
        message: `Kate's local data could not be removed.`,
      });
    }
  };
}
