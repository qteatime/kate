import { InputKey } from "../../../kernel";
import { unreachable } from "../../../utils";
import {
  ChangedSetting,
  KeyboardToKate,
  SettingsData,
} from "../../apis/settings";
import { KateOS } from "../../os";
import * as UI from "../../ui";

export class SceneInputSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Controller & Sensors"];

  body() {
    const data = this.os.settings.get("input");

    return [
      UI.h("h3", {}, ["Virtual buttons"]),
      UI.info_cell(
        UI.text_panel({
          title: "Haptic feedback",
          description: "Vibrate the console when a virtual button is touched",
        }),
        [
          UI.toggle(data.haptic_feedback_for_virtual_button, {
            on_changed: this.handle_haptics_change,
          }),
        ]
      ),

      UI.h("h3", {}, ["Alternative input methods"]),
      UI.button("Configure keyboard mappings", {
        on_clicked: () => {
          this.os.push_scene(new KeyboardInputSettings(this.os));
        },
      }),
      UI.vspace(6),
      UI.button("Configure gamepad mappings", {}),
    ];
  }

  handle_haptics_change = async (x: boolean) => {
    await this.os.settings.update("input", (v) => ({
      ...v,
      haptic_feedback_for_virtual_button: x,
    }));
    await this.os.notifications.log(
      "kate:settings",
      "Updated input settings",
      `Haptic feedback on virtual input: ${x}`
    );
  };
}

class KeyboardInputSettings extends UI.SimpleScene {
  icon = "keyboard";
  title = ["Keyboard mappings"];

  body() {
    const mappings = this.os.settings.get("input").keyboard_mapping;

    return [
      UI.button("Add a new mapping", {
        on_clicked: this.handle_add_new_mapping,
      }),
      UI.vspace(16),
      UI.h("div", { class: "kate-os-keyboard-mapping-list" }, [
        ...mappings.map((x) => this.render_mapping_entry(x)),
      ]),
    ];
  }

  on_attached(): void {
    super.on_attached();
    this.os.settings.on_settings_changed.listen(this.handle_mappings_update);
  }

  on_detached(): void {
    this.os.settings.on_settings_changed.remove(this.handle_mappings_update);
    super.on_detached();
  }

  render_mapping_entry(x: KeyboardToKate) {
    return UI.info_line(x.key, x.buttons.map(UI.icon));
  }

  handle_mappings_update = (ev: ChangedSetting<keyof SettingsData>) => {
    if (ev.key === "input") {
      const input = ev.value as SettingsData["input"];
      const list = this.canvas.querySelector(".kate-os-keyboard-mapping-list")!;
      list.textContent = "";
      for (const entry of input.keyboard_mapping) {
        list.append(this.render_mapping_entry(entry));
      }
    }
  };

  handle_add_new_mapping = () => {
    this.os.push_scene(new KeyboardMappingSettings(this.os));
  };
}

class KeyboardMappingSettings extends UI.SimpleScene {
  icon = "keyboard";
  title = ["Add keyboard mapping"];

  private initial_key: string | null;
  private key: string | null;
  private buttons: InputKey[];

  constructor(os: KateOS, key?: string, buttons?: InputKey[]) {
    super(os);
    this.initial_key = key ?? null;
    this.key = key ?? null;
    this.buttons = buttons ?? [];
  }

  body() {
    return [
      UI.p(["When I press on the keyboard:"]),
      this.key_feedback(),
      UI.vspace(16),
      UI.p(["Press the following buttons in Kate:"]),
      UI.h("div", { class: "kate-os-keyboard-mapping-button-grid" }, [
        this.button("up"),
        this.button("right"),
        this.button("down"),
        this.button("left"),
        this.button("o"),
        this.button("x"),
        this.button("ltrigger"),
        this.button("rtrigger"),
        this.button("capture"),
        this.button("menu"),
      ]),
      UI.vspace(16),
      UI.button("Save mapping", {
        on_clicked: this.handle_save,
      }),
    ];
  }

  key_feedback() {
    const element = UI.h(
      "div",
      { class: "kate-os-keyboard-mapping-feedback kate-ui-focus-target" },
      [this.key ? friendly_keyboard(this.key) : "(No key selected)"]
    );
    element.addEventListener("click", (ev) => {
      if (element.classList.contains("wait-for-key")) {
        return;
      }

      const input = document.createElement("input");
      element.classList.add("wait-for-key");
      element.textContent = "Press a key to map...";
      element.append(input);
      setTimeout(() => {
        input.focus();
      });
      const handle_key = (ev: KeyboardEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        input.removeEventListener("keydown", handle_key);
        element.classList.remove("wait-for-key");
        this.key = ev.code;
        element.textContent = friendly_keyboard(this.key);
      };
      input.addEventListener("keydown", handle_key);
    });
    return element;
  }

  button(key: InputKey) {
    const element = UI.h(
      "div",
      { class: "kate-os-button-mapping kate-ui-focus-target" },
      [UI.icon(key), friendly_button(key)]
    );
    if (this.buttons.includes(key)) {
      element.classList.add("active");
    }
    element.addEventListener("click", () => {
      const mapped = this.buttons.includes(key);
      if (mapped) {
        this.buttons = this.buttons.filter((x) => x !== key);
        element.classList.remove("active");
      } else {
        this.buttons.push(key);
        element.classList.add("active");
      }
    });

    return element;
  }

  handle_save = async () => {
    const key = this.key;
    const buttons = this.buttons;
    if (key == null || buttons.length === 0) {
      return;
    }

    const bound = this.os.settings
      .get("input")
      .keyboard_mapping.find((x) => x.key === this.key);
    if (this.initial_key != key && bound != null) {
      const update = await this.os.dialog.confirm("kate:settings", {
        title: "Key is already bound",
        message: `${key} is already bound to ${bound.buttons
          .map(friendly_button)
          .join(" + ")}. Replace the existing mapping?`,
        cancel: "Keep existing",
        ok: "Replace mapping",
        dangerous: true,
      });
      if (!update) {
        return;
      }
    }

    const input = await this.os.settings.update("input", (x) => {
      const mappings0 = x.keyboard_mapping.filter((m) => m.key !== key);
      const mappings = [...mappings0, { key: key, buttons: buttons }];
      return { ...x, keyboard_mapping: mappings };
    });
    this.os.kernel.keyboard.remap(input.keyboard_mapping);
    await this.os.notifications.log(
      "kate:settings",
      "Updated key mapping",
      `${key} -> ${buttons.join(" + ")}`
    );
    this.os.pop_scene();
  };
}

function friendly_button(x: InputKey) {
  switch (x) {
    case "up":
      return "Up";
    case "right":
      return "Right";
    case "down":
      return "Down";
    case "left":
      return "Left";

    case "capture":
      return "Capture";
    case "menu":
      return "Menu";

    case "ltrigger":
      return "L trigger";
    case "rtrigger":
      return "R trigger";

    case "o":
      return "Ok";
    case "x":
      return "Cancel";

    default:
      throw unreachable(x);
  }
}

export function friendly_keyboard(x: string) {
  return x; // TODO: return a better key representation here
}
