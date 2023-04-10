import { InputKey } from "../../../kernel";
import { unreachable } from "../../../utils";
import {
  ChangedSetting,
  GamepadToKate,
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
          UI.toggle(this.os, data.haptic_feedback_for_virtual_button, {
            on_changed: this.handle_haptics_change,
          }),
        ]
      ),

      UI.h("h3", {}, ["Alternative input methods"]),
      UI.text_button(this.os, "Configure keyboard mappings", {
        on_click: () => {
          this.os.push_scene(new KeyboardInputSettings(this.os));
        },
      }),
      UI.vspace(6),
      UI.text_button(this.os, "Configure gamepad mappings", {
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
      UI.text_button(this.os, "Add a new mapping", {
        on_click: this.handle_add_new_mapping,
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
    return UI.interactive(
      this.os,
      UI.info_cell(x.key, x.buttons.map(UI.icon)),
      [
        {
          key: ["o"],
          label: "Edit",
          on_click: true,
          handler: () => {
            this.os.push_scene(
              new KeyboardMappingSettings(this.os, x.key, x.buttons)
            );
          },
        },
        {
          key: ["menu"],
          label: "Options",
          on_menu: true,
          handler: async () => {
            const result = await this.os.dialog.pop_menu(
              "kate:settings",
              `${friendly_keyboard(x.key)}`,
              [
                {
                  label: "Edit",
                  value: "edit" as const,
                },
                {
                  label: "Delete",
                  value: "delete" as const,
                },
              ],
              null
            );
            switch (result) {
              case "edit": {
                this.os.push_scene(
                  new KeyboardMappingSettings(this.os, x.key, x.buttons)
                );
                return;
              }

              case "delete": {
                await this.os.settings.update("input", (input) => {
                  const mappings = input.keyboard_mapping.filter(
                    (m) => m.key !== x.key
                  );
                  return { ...input, keyboard_mapping: mappings };
                });
                return;
              }

              case null:
                return;

              default:
                throw unreachable(result);
            }
          },
        },
      ]
    );
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
      UI.text_button(this.os, "Save mapping", {
        on_click: this.handle_save,
      }),
    ];
  }

  key_feedback() {
    const element = UI.h(
      "div",
      { class: "kate-os-keyboard-mapping-feedback kate-ui-focus-target" },
      [this.key ? friendly_keyboard(this.key) : "(No key selected)"]
    );

    return UI.interactive(this.os, element, [
      {
        key: ["o"],
        on_click: true,
        label: "Choose key",
        handler: () => {
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
        },
      },
    ]);
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
    return UI.interactive(this.os, element, [
      {
        key: ["o"],
        label: "Toggle",
        on_click: true,
        handler: () => {
          const mapped = this.buttons.includes(key);
          if (mapped) {
            this.buttons = this.buttons.filter((x) => x !== key);
            element.classList.remove("active");
          } else {
            this.buttons.push(key);
            element.classList.add("active");
          }
        },
      },
    ]);
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

class GamepadInputSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Gamepad mappings"];

  body() {
    return [
      UI.h("div", { class: "settings-gamepad-new" }, [
        UI.p(["Checking for connected gamepads..."]),
      ]),
      UI.h("div", { class: "settings-gamepad-list" }, []),
    ];
  }

  on_attached(): void {
    super.on_attached();
    this.detect_gamepad();
    this.os.settings.on_settings_changed.listen(this.handle_settings_changed);
  }

  on_detached(): void {
    this.os.settings.on_settings_changed.remove(this.handle_settings_changed);
    super.on_detached();
  }

  handle_settings_changed = (change: ChangedSetting<keyof SettingsData>) => {
    if (change.key === "input") {
      const input = change.value as SettingsData["input"];
      this.render_gamepad_layouts(input.gamepads);
    }
  };

  render_gamepad_layouts(layouts: GamepadToKate[]) {
    const canvas = this.canvas.querySelector(".settings-gamepad-list")!;
    canvas.textContent = "";
    for (const layout of layouts) {
      UI.append(this.render_gamepad_layout(layout), canvas);
    }
  }

  render_new_layouts(gamepads: Gamepad[]) {
    const canvas = this.canvas.querySelector(".settings-gamepad-new")!;
    canvas.textContent = "";
    for (const gamepad of gamepads) {
      UI.append(this.render_new_layout(gamepad), canvas);
    }
  }

  render_new_layout(gamepad: Gamepad) {
    return UI.interactive(
      this.os,
      UI.padded_container("1x", [
        UI.text_panel({
          title: gamepad.id,
          description: `Connected on port ${gamepad.index}`,
        }),
      ]),
      [
        {
          key: ["o"],
          on_click: true,
          label: "Edit",
          handler: () => {
            this.os.push_scene(
              new StandardGamepadMappingSettings(this.os, gamepad, null)
            );
          },
        },
      ]
    );
  }

  render_gamepad_layout(layout: GamepadToKate) {
    const gamepad = this.gamepad_for_id(layout.id);
    if (gamepad == null) {
      return UI.focusable_container([
        UI.padded_container("1x", [
          UI.text_panel({
            title: layout.id,
            description: "Not connected. (Connect to edit)",
          }),
        ]),
      ]);
    } else {
      return UI.interactive(
        this.os,
        UI.padded_container("1x", [
          UI.text_panel({
            title: layout.id,
            description: `Connected on port ${gamepad.index}`,
          }),
        ]),
        [
          {
            key: ["o"],
            on_click: true,
            label: "Edit",
            handler: () => {
              this.os.push_scene(
                new StandardGamepadMappingSettings(this.os, gamepad, layout)
              );
            },
          },
          {
            key: ["menu"],
            on_menu: true,
            label: "Options",
            handler: () => {},
          },
        ]
      );
    }
  }

  gamepad_for_id(id: string) {
    const gamepad = navigator.getGamepads();
    return (
      gamepad.find((x) => x != null && x.connected === true && x.id === id) ??
      null
    );
  }

  detect_gamepad = () => {
    const gamepads = navigator.getGamepads();
    const canvas = this.canvas.querySelector(".settings-gamepad-new")!;
    if (gamepads.every((x) => x === null)) {
      canvas.textContent =
        "No gamepads connected. Connect a gamepad to configure it here.";
      setTimeout(this.detect_gamepad, 1_000);
    } else {
      canvas.textContent = "";
      const layouts = this.os.settings.get("input").gamepads;
      const existing = layouts.some((layout) => {
        return gamepads.some((g) => g != null && g.id === layout.id);
      });
      const unmapped = gamepads.flatMap((x) => {
        if (x == null || layouts.some((l) => l.id === x.id)) {
          return [];
        } else {
          return x;
        }
      });
      if (existing) {
        this.render_gamepad_layouts(layouts);
      }
      if (unmapped.length > 0) {
        this.render_new_layouts(unmapped);
      }
    }
  };
}

export class StandardGamepadMappingSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Configure gamepad mappings"];

  private _buttons = new Map<number, HTMLElement>();
  private _haxes = new Map<number, HTMLElement>();
  private _vaxes = new Map<number, HTMLElement>();
  private _last_update: number | null = null;

  constructor(
    os: KateOS,
    readonly gamepad: Gamepad,
    readonly layout: GamepadToKate | null
  ) {
    super(os);
  }

  body() {
    return [
      UI.h("div", { class: "standard-gamepad-frame" }, [
        UI.h(
          "div",
          { class: "standard-gamepad-left standard-gamepad-cluster" },
          [
            UI.h(
              "div",
              {
                class: "standard-gamepad-button1 standard-gamepad-button",
                "data-index": "12",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button2 standard-gamepad-button",
                "data-index": "15",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button3 standard-gamepad-button",
                "data-index": "13",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button4 standard-gamepad-button",
                "data-index": "14",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          { class: "standard-gamepad-right standard-gamepad-cluster" },
          [
            UI.h(
              "div",
              {
                class: "standard-gamepad-button1 standard-gamepad-button",
                "data-index": "3",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button2 standard-gamepad-button",
                "data-index": "1",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button3 standard-gamepad-button",
                "data-index": "0",
              },
              []
            ),
            UI.h(
              "div",
              {
                class: "standard-gamepad-button4 standard-gamepad-button",
                "data-index": "2",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          {
            class: "standard-gamepad-special standard-gamepad-special-left",
            "data-index": "8",
          },
          []
        ),
        UI.h(
          "div",
          {
            class: "standard-gamepad-special standard-gamepad-special-center",
            "data-index": "16",
          },
          []
        ),
        UI.h(
          "div",
          {
            class: "standard-gamepad-special standard-gamepad-special-right",
            "data-index": "9",
          },
          []
        ),
        UI.h(
          "div",
          { class: "standard-gamepad-axes standard-gamepad-axes-left" },
          [
            UI.h(
              "div",
              {
                class: "standard-gamepad-joystick",
                "data-axis-h": "0",
                "data-axis-v": "1",
                "data-index": "10",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          { class: "standard-gamepad-axes standard-gamepad-axes-right" },
          [
            UI.h(
              "div",
              {
                class: "standard-gamepad-joystick",
                "data-axis-h": "2",
                "data-axis-v": "3",
                "data-index": "11",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          { class: "standard-gamepad-shoulder standard-gamepad-shoulder-left" },
          [
            UI.h(
              "div",
              {
                class:
                  "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
                "data-index": "6",
              },
              []
            ),
            UI.h(
              "div",
              {
                class:
                  "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
                "data-index": "4",
              },
              []
            ),
          ]
        ),
        UI.h(
          "div",
          {
            class: "standard-gamepad-shoulder standard-gamepad-shoulder-right",
          },
          [
            UI.h(
              "div",
              {
                class:
                  "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
                "data-index": "7",
              },
              []
            ),
            UI.h(
              "div",
              {
                class:
                  "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
                "data-index": "5",
              },
              []
            ),
          ]
        ),
      ]),
    ];
  }

  on_attached(): void {
    this.os.kernel.console.on_tick.listen(this.update_gamepad_status);
    this.os.kernel.gamepad.pause(this.gamepad);
    this._buttons = new Map();
    for (const button of Array.from(
      this.canvas.querySelectorAll("div[data-index]")
    )) {
      this._buttons.set(
        Number(button.getAttribute("data-index")),
        button as HTMLElement
      );
    }
    this._haxes = new Map();
    for (const axes of Array.from(
      this.canvas.querySelectorAll("div[data-axis-h]")
    )) {
      this._haxes.set(
        Number(axes.getAttribute("data-axis-h")),
        axes as HTMLElement
      );
    }
    this._vaxes = new Map();
    for (const axes of Array.from(
      this.canvas.querySelectorAll("div[data-axis-v]")
    )) {
      this._vaxes.set(
        Number(axes.getAttribute("data-axis-v")),
        axes as HTMLElement
      );
    }
    super.on_attached();
  }

  on_detached(): void {
    this.os.kernel.console.on_tick.remove(this.update_gamepad_status);
    this.os.kernel.gamepad.unpause(this.gamepad);
    super.on_detached();
  }

  update_gamepad_status = () => {
    const gamepad = navigator
      .getGamepads()
      .find((x) => x != null && x.id === this.gamepad.id);
    if (gamepad == null) {
      return;
    }
    if (this._last_update != null && gamepad.timestamp < this._last_update) {
      return;
    }
    for (const [key, button] of this._buttons) {
      button.classList.toggle("active", gamepad.buttons[key].pressed);
    }
    for (const [key, stick] of this._haxes) {
      stick.style.left = `${axis_to_offset(gamepad.axes[key])}%`;
    }
    for (const [key, stick] of this._vaxes) {
      stick.style.top = `${axis_to_offset(gamepad.axes[key])}%`;
    }
    this._last_update = gamepad.timestamp;
  };
}

function axis_to_offset(x: number) {
  return x * 30 + 50;
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
