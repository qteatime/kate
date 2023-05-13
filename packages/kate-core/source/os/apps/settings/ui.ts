import type { ConsoleCase } from "../../../kernel";
import { Observable, unreachable } from "../../../utils";
import { SettingsData } from "../../apis/settings";
import * as UI from "../../ui";

export class SceneUISettings extends UI.SimpleScene {
  icon = "window-maximize";
  title = ["User Interface"];

  body() {
    const data = this.os.settings.get("ui");
    const kase = new Observable(data.case_type);

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

      UI.vspace(32),
      UI.h("h3", {}, ["Display mode"]),
      UI.h("div", { class: "kate-os-mode-choices" }, [
        UI.hchoices(1, [
          this.mode_button(kase, {
            mode: "handheld",
            title: "Handheld mode",
            image: "img/handheld-mode.png",
          }),
          this.mode_button(kase, {
            mode: "tv",
            title: "TV mode",
            image: "img/tv-mode.png",
          }),
          this.mode_button(kase, {
            mode: "fullscreen",
            title: "Fullscreen mode",
            image: "img/fullscreen-mode.png",
          }),
        ]),
      ]),

      UI.vspace(16),

      UI.link_card(this.os, {
        arrow: "pencil",
        click_label: "Change",
        title: "Resolution",
        description: "The size Kate's contents are rendered in",
        value: UI.dynamic(
          kase.map<UI.Widgetable>((x) => friendly_resolution(x.resolution))
        ),
        on_click: () => {
          this.select_resolution(kase);
        },
      }),

      UI.dynamic(
        kase.map<UI.Widgetable>((x) => {
          return UI.toggle_cell(this.os, {
            title: "Scale to fit screen",
            description:
              "Scale Kate up to fit the whole screen, might result in blurry images",
            value: x.scale_to_fit,
            on_label: "Yes",
            off_label: "No",
            on_changed: (x) => {
              this.set_case(kase, { ...kase.value, scale_to_fit: x });
            },
          });
        })
      ),
    ];
  }

  async select_resolution(current: Observable<ConsoleCase>) {
    const available =
      current.value.type === "handheld"
        ? ([480] as const)
        : ([480, 720, 960, 1080] as const);
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
    this.set_case(current, {
      type: current.value.type,
      resolution: result,
      scale_to_fit: current.value.scale_to_fit,
    });
  }

  async set_case(current: Observable<ConsoleCase>, kase: ConsoleCase) {
    this.os.kernel.console.set_case(kase);
    current.value = kase;
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

  private mode_button(
    kase: Observable<ConsoleCase>,
    x: { mode: ConsoleCase["type"]; title: string; image: string }
  ) {
    return UI.choice_button(
      this.os,
      UI.vbox(1, [UI.image(x.image), UI.h("div", {}, [x.title])]),
      {
        selected: kase.map((k) => k.type === x.mode),
        on_select: () => {
          this.set_case(kase, case_defaults(x.mode));
        },
      }
    );
  }
}

function friendly_resolution(height: number) {
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 480;
  const factor = height / BASE_HEIGHT;

  return `${BASE_WIDTH * factor} x ${BASE_HEIGHT * factor}`;
}

function case_defaults(type: ConsoleCase["type"]): ConsoleCase {
  switch (type) {
    case "handheld": {
      return { type: "handheld", resolution: 480, scale_to_fit: false };
    }

    case "tv": {
      return { type: "tv", resolution: 720, scale_to_fit: false };
    }

    case "fullscreen": {
      return { type: "fullscreen", resolution: 720, scale_to_fit: true };
    }

    default:
      throw unreachable(type, "case type");
  }
}
