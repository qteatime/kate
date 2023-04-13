import * as UI from "../../ui";
import type { KateOS } from "../../os";
import {
  ChangedSetting,
  SettingsData,
  GamepadToKate,
} from "../../apis/settings";

export class GamepadInputSettings extends UI.SimpleScene {
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
