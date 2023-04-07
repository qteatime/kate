import * as UI from "../../ui";

export class SceneRecovery extends UI.SimpleScene {
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

      UI.button("Restore default settings", {
        on_clicked: this.restore_default_settings,
      }),
      UI.p([`Switch all settings back to the default ones.`]),
      UI.vdivider(),

      UI.button("Delete all data", { on_clicked: this.delete_all_data }),
      UI.p([
        `Delete ALL data locally stored in the console. The application will reload
        afterwards.`,
      ]),
    ];
  }

  restore_default_settings = async () => {
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

  delete_all_data = async () => {
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
