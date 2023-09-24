/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as UI from "../../ui";
import { GamepadInputSettings } from "./gamepad-input";
import { KeyboardInputSettings } from "./keyboard-input";

export class SceneInputSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Controller & Sensors"];

  body() {
    const data = this.os.settings.get("input");

    return [
      UI.h("h3", {}, ["Virtual buttons"]),
      UI.toggle_cell(this.os, {
        value: data.haptic_feedback_for_virtual_button,
        title: "Haptic feedback",
        description: "Vibrate the console when a virtual button is touched",
        on_changed: this.handle_haptics_change,
      }),

      UI.h("h3", {}, ["Alternative input methods"]),
      UI.link_card(this.os, {
        icon: "keyboard",
        title: "Control Kate with a keyboard",
        description: "Configure keyboard mappings for Kate buttons",
        on_click: () => {
          this.os.push_scene(new KeyboardInputSettings(this.os));
        },
      }),
      UI.vspace(6),
      UI.link_card(this.os, {
        icon: "gamepad",
        title: "Control Kate with a standard gamepad",
        description:
          "Select a gamepad and configure how it maps to Kate buttons",
        on_click: () => {
          this.os.push_scene(new GamepadInputSettings(this.os));
        },
      }),
    ];
  }

  handle_haptics_change = async (x: boolean) => {
    await this.os.settings.update("input", (v) => ({
      ...v,
      haptic_feedback_for_virtual_button: x,
    }));
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "low",
      type: "kate.settings.input.updated",
      message: "Updated input settings",
      extra: { haptic_feedback_for_virtual_button: x },
    });
  };
}
