import type { ConsoleCase, ConsoleCaseTV } from "../../../kernel";
import { Observable } from "../../../utils";
import { SettingsData } from "../../apis/settings";
import * as UI from "../../ui";

export class SceneUISettings extends UI.SimpleScene {
  icon = "window-maximize";
  title = ["User Interface"];

  body() {
    const data = this.os.settings.get("ui");
    const resolution = new Observable(
      data.case_type.type === "handheld" ? 480 : data.case_type.resolution
    );

    return [
      UI.toggle_cell(this.os, {
        value: data.sound_feedback,
        title: "Audio feedback for buttons",
        description: "Play a sound when you interact with the UI using buttons",
        on_changed: (v) => {
          this.change("sound_feedback", v);
          this.os.sfx.set_enabled(v);
        },
      }),

      UI.toggle_cell(this.os, {
        value: data.animation_effects,
        title: "Animation effects",
        description: "Enable motion-based effects; OS settings have precedence",
        on_changed: (v) => {
          this.change("animation_effects", v);
          this.os.set_os_animation(v);
        },
      }),

      UI.h("h3", {}, ["Display mode"]),
      UI.hbox(2, [
        UI.interactive(
          this.os,
          UI.vbox(1, [UI.image("img/handheld.png"), "Handheld mode"]),
          [
            {
              key: ["o"],
              label: "Select",
              on_click: true,
              handler: (key, is_repeat) => {
                this.set_case(resolution, { type: "handheld" });
              },
            },
          ]
        ),
        UI.interactive(
          this.os,
          UI.vbox(1, [UI.image("img/tv.png"), "TV mode"]),
          [
            {
              key: ["o"],
              label: "Select",
              on_click: true,
              handler: (key, is_repeat) => {
                this.set_case(resolution, { type: "tv", resolution: 720 });
              },
            },
          ]
        ),
      ]),
      UI.interactive(
        this.os,
        UI.info_line(
          "Resolution",
          [UI.dynamic(resolution.map<UI.Widgetable>(friendly_resolution))],
          { interactive: false }
        ),
        [
          {
            key: ["o"],
            label: "Select",
            on_click: true,
            handler: () => {
              this.select_resolution(resolution);
            },
          },
        ]
      ),
    ];
  }

  async select_resolution(current: Observable<ConsoleCaseTV["resolution"]>) {
    const case_type = this.os.settings.get("ui").case_type;
    const available =
      case_type.type === "handheld"
        ? ([480] as const)
        : ([480, 720, 960] as const);
    const result = await this.os.dialog.pop_menu(
      "kate:settings",
      "Display resolution",
      available.map((x) => ({
        label: friendly_resolution(x),
        value: x,
      })),
      null
    );
    if (result == null) {
      return;
    }
    this.set_case(current, { type: case_type.type, resolution: result });
  }

  async set_case(
    resolution: Observable<ConsoleCaseTV["resolution"]>,
    kase: ConsoleCase
  ) {
    this.os.kernel.console.set_case(kase);
    resolution.value = kase.type === "handheld" ? 480 : kase.resolution;
    await this.os.settings.update("ui", (x) => {
      return { ...x, case_type: kase };
    });
    await this.os.notifications.log(
      "kate:settings",
      "Updated display mode",
      `${JSON.stringify(kase)}`
    );
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

function friendly_resolution(height: number) {
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 480;
  const factor = height / BASE_HEIGHT;

  return `${BASE_WIDTH * factor} x ${BASE_HEIGHT * factor} (5:3)`;
}
