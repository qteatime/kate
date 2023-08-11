import type { ConsoleCase } from "../../../kernel";
import { Observable, unreachable } from "../../../utils";
import { SettingsData } from "../../apis/settings";
import * as UI from "../../ui";

export class SceneUISettings extends UI.SimpleScene {
  icon = "window-maximize";
  title = ["User Interface"];

  async can_change_display_mode() {
    switch (this.os.kernel.console.options.mode) {
      case "native":
        return !(await KateNative?.is_fullscreen());

      case "single":
        return false;

      case "web":
        return true;
    }
  }

  get supports_fullscreen() {
    return this.os.kernel.console.options.mode !== "native";
  }

  get supports_scale_to_fit() {
    return this.os.kernel.console.options.mode !== "native";
  }

  async body() {
    const data = this.os.settings.get("ui");
    const configurable_display = await this.can_change_display_mode();
    const kase = new Observable(
      configurable_display ? data.case_type : this.os.kernel.console.raw_case
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

      UI.vspace(32),
      UI.h("h3", {}, ["Display mode"]),

      UI.when(configurable_display, [
        UI.h("div", { class: "kate-os-mode-choices" }, [
          UI.hchoices(3, [
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
            UI.when(this.supports_fullscreen, [
              this.mode_button(kase, {
                mode: "fullscreen",
                title: "Fullscreen mode",
                image: "img/fullscreen-mode.png",
              }),
            ]),
          ]),
        ]),

        UI.vspace(16),
      ]),

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

      UI.when(this.supports_scale_to_fit, [
        UI.toggle_cell(this.os, {
          title: "Scale to fit screen",
          description:
            "Scale Kate up to fit the whole screen, might result in blurry images",
          value: kase.map((x) => x.scale_to_fit),
          on_label: "Yes",
          off_label: "No",
          on_changed: (x) => {
            this.set_case(kase, { ...kase.value, scale_to_fit: x });
          },
        }),
      ]),
    ];
  }

  async select_resolution(current: Observable<ConsoleCase>) {
    const available =
      current.value.type === "handheld"
        ? ([480] as const)
        : ([480, 720] as const);
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
    if (await this.can_change_display_mode()) {
      await this.os.settings.update("ui", (x) => {
        return { ...x, case_type: kase };
      });
      await this.os.audit_supervisor.log("kate:settings", {
        resources: ["kate:settings"],
        risk: "low",
        type: "kate.settings.ui.updated",
        message: "Updated display mode",
        extra: { case_type: kase },
      });
    }
  }

  async change<K extends keyof SettingsData["ui"]>(
    key: K,
    value: SettingsData["ui"][K]
  ) {
    await this.os.settings.update("ui", (x) => {
      return { ...x, [key]: value };
    });
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "low",
      type: "kate.settings.ui.updated",
      message: "Updated UI settings",
      extra: { [key]: value },
    });
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
