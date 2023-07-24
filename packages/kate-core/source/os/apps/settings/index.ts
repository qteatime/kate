import * as UI from "../../ui";
import { SceneInputSettings } from "./input";
import { ScenePermissions } from "./permissions";
import { ScenePlayHabitsSettings } from "./play-habits";
import { SceneRecovery } from "./recovery";
import { SceneStorageSettings } from "./storage";
import { SceneUISettings } from "./ui";

export class SceneSettings extends UI.SimpleScene {
  icon = "gear";
  title = ["Settings"];

  body() {
    return [
      UI.when(this.os.kernel.console.options.mode !== "single", [
        UI.link_card(this.os, {
          icon: "calendar",
          title: "Play habits",
          description: "Recently played and play time",
          on_click: () => {
            this.os.push_scene(new ScenePlayHabitsSettings(this.os));
          },
        }),
      ]),

      UI.link_card(this.os, {
        icon: "gamepad",
        title: "Controller & Sensors",
        description:
          "Configure virtual buttons, keyboard, gamepad, and other input sources",
        on_click: () => {
          this.os.push_scene(new SceneInputSettings(this.os));
        },
      }),

      UI.link_card(this.os, {
        icon: "window-maximize",
        title: "User Interface",
        description:
          "Configure appearance and audio/visual feedback for KateOS",
        on_click: () => {
          this.os.push_scene(new SceneUISettings(this.os));
        },
      }),

      UI.when(this.os.kernel.console.options.mode !== "single", [
        UI.link_card(this.os, {
          icon: "hard-drive",
          title: "Storage",
          description: "Visualise and manage storage usage",
          on_click: () => {
            this.os.push_scene(new SceneStorageSettings(this.os));
          },
        }),
      ]),

      UI.link_card(this.os, {
        icon: "key",
        title: "Permissions",
        description:
          "What cartridges are allowed to do with your device and data",
        on_click: () => {
          this.os.push_scene(new ScenePermissions(this.os));
        },
      }),

      UI.link_card(this.os, {
        icon: "stethoscope",
        title: "Diagnostics & Recovery",
        description: "Troubleshoot and reset parts of the console",
        on_click: () => {
          this.os.push_scene(new SceneRecovery(this.os));
        },
      }),
    ];
  }
}
