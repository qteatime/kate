import { SettingsData } from "../../apis/settings";
import * as UI from "../../ui";

export class SceneUISettings extends UI.SimpleScene {
  icon = "window-maximize";
  title = ["User Interface"];

  body() {
    const data = this.os.settings.get("ui");

    return [
      UI.info_cell(
        UI.text_panel({
          title: "Audio feedback for buttons",
          description:
            "Play a sound when you interact with the UI using buttons",
        }),
        [
          UI.toggle(this.os, data.sound_feedback, {
            on_changed: (v) => {
              this.change("sound_feedback", v);
              this.os.sfx.set_enabled(v);
            },
          }),
        ]
      ),

      UI.info_cell(
        UI.text_panel({
          title: "Animation effects",
          description:
            "Enable motion-based effects; OS settings have precedence",
        }),
        [
          UI.toggle(this.os, data.animation_effects, {
            on_changed: (v) => {
              this.change("animation_effects", v);
              this.os.set_os_animation(v);
            },
          }),
        ]
      ),
    ];
  }

  async change<K extends keyof SettingsData["ui"]>(
    key: K,
    value: SettingsData["ui"][K]
  ) {
    await this.os.settings.update("ui", (x) => {
      return { ...x, [key]: value };
    });
    await this.os.notifications.log(
      "kate:settings",
      `Updated UI settings`,
      `${key}: ${value}`
    );
  }
}
