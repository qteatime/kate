/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as UI from "../../ui";
import { SceneAudit, SceneAuditLog } from "./audit";
import { SceneDeveloperSettings } from "./developer";
import { SceneInputSettings } from "./input";
import { SceneKeyStoreSettings } from "./key-store";
import { ScenePermissions } from "./permissions";
import { ScenePlayHabitsSettings } from "./play-habits";
import { SceneRecovery } from "./recovery";
import { SceneStorageSettings } from "./storage";
import { SceneUISettings } from "./ui";

export class SceneSettings extends UI.SimpleScene {
  readonly application_id = "kate:settings";
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
        description: "Configure virtual buttons, keyboard, gamepad, and other input sources",
        on_click: () => {
          this.os.push_scene(new SceneInputSettings(this.os));
        },
      }),

      UI.link_card(this.os, {
        icon: "window-maximize",
        title: "User Interface",
        description: "Configure appearance and audio/visual feedback for KateOS",
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

      UI.when(this.os.kernel.console.options.mode !== "single", [
        UI.link_card(this.os, {
          icon: "key",
          title: "Permissions",
          description: "What cartridges are allowed to do with your device and data",
          on_click: () => {
            this.os.push_scene(new ScenePermissions(this.os));
          },
        }),
      ]),

      UI.link_card(this.os, {
        icon: "stethoscope",
        title: "Diagnostics & Recovery",
        description: "Troubleshoot and reset parts of the console",
        on_click: () => {
          this.os.push_scene(new SceneRecovery(this.os));
        },
      }),

      UI.link_card(this.os, {
        icon: "eye",
        title: "Audit",
        description: "See what your console and cartridges have been doing behind the scenes",
        on_click: () => {
          this.os.push_scene(new SceneAudit(this.os));
        },
      }),

      UI.link_card(this.os, {
        icon: "vault",
        title: "Secure key store",
        description: "See and manage your digital signing and verification keys",
        on_click: () => {
          this.os.push_scene(new SceneKeyStoreSettings(this.os));
        },
      }),

      UI.when(this.os.kernel.console.options.mode !== "single", [
        UI.link_card(this.os, {
          icon: "code",
          title: "For developers",
          description: `
            Settings intended only for those making their own cartridges for Kate.
          `,
          on_click: () => {
            this.os.push_scene(new SceneDeveloperSettings(this.os));
          },
        }),
      ]),
    ];
  }
}
