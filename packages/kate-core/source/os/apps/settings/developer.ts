/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { SettingsData } from "../../apis";
import * as UI from "../../ui";

export class SceneDeveloperSettings extends UI.SimpleScene {
  readonly application_id = "kate:settings:developer";
  icon = "code";
  title = ["Developer settings"];

  body() {
    const data = this.os.settings.get("developer");

    return [
      UI.p([
        `These settings are intended for users making cartridges for Kate.
        Updating these settings may impact Kate's stability, security, and privacy.`,
      ]),

      UI.toggle_cell(this.os, {
        value: data.allow_version_overwrite,
        title: "Allow overwriting a cartridge",
        description: `
          Stop Kate from ignoring cartridge installs when the cartridge's
          version is already installed. Useful for iterating.
        `,
        on_changed: (v) => {
          this.change("allow_version_overwrite", v);
        },
      }),
    ];
  }

  async change<K extends keyof SettingsData["developer"]>(
    key: K,
    value: SettingsData["developer"][K]
  ) {
    await this.os.settings.update("developer", (x) => {
      return { ...x, [key]: value };
    });
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "high",
      type: "kate.settings.developer.updated",
      message: "Updated developer settings",
      extra: { [key]: value },
    });
  }
}
