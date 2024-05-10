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
