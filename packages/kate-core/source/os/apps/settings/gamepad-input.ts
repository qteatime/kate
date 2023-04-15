import * as UI from "../../ui";
import type { KateOS } from "../../os";
import { ChangedSetting, SettingsData } from "../../apis/settings";
import { Observable, clamp, enumerate, unreachable } from "../../../utils";
import { friendly_gamepad_id } from "../../../friendly/gamepad";
import { GamepadButtonToKate, GamepadMapping } from "../../../kernel";

export class GamepadInputSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Gamepad settings"];

  body() {
    return [
      UI.link_card(this.os, {
        title: "Test gamepad input",
        description: "Check how Kate reads your gamepad buttons",
        on_click: () => {
          this.os.push_scene(new TestStandardMappingSettings(this.os));
        },
      }),
      UI.link_card(this.os, {
        title: "Configure standard mapping",
        description: "Change button configuration for standard gamepads",
        on_click: () => {
          this.os.push_scene(new RemapStandardSettings(this.os));
        },
      }),
      UI.vspace(6),
      UI.link_card(this.os, {
        title: "Change active gamepad",
        description: "Choose which connected gamepad will control Kate",
        on_click: () => {
          this.os.push_scene(new ChooseActiveGamepadSettings(this.os));
        },
      }),
    ];
  }
}

export class TestStandardMappingSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Test gamepad input"];
  subtitle = "Hold any button to exit";

  private _buttons = new Map<number, HTMLElement>();
  private _haxes = new Map<number, HTMLElement>();
  private _vaxes = new Map<number, HTMLElement>();
  private _last_update: number | null = null;
  private _pressed = new Map<number, number | null>();

  body() {
    return [UI.centered_container(standard_frame())];
  }

  on_attached(): void {
    this.os.kernel.console.on_tick.listen(this.update_gamepad_status);
    this.os.kernel.gamepad.pause();
    this.index_buttons();
    super.on_attached();
  }

  on_detached(): void {
    super.on_detached();
    this.os.kernel.gamepad.unpause();
    this.os.kernel.console.on_tick.remove(this.update_gamepad_status);
  }

  index_buttons = () => {
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
  };

  update_gamepad_status = (time: number) => {
    const gamepad = this.os.kernel.gamepad.current?.raw;
    if (gamepad == null) {
      return;
    }
    for (const [index, button] of enumerate(gamepad.buttons)) {
      if (!button.pressed) {
        this._pressed.set(index, null);
      } else {
        const previous = this._pressed.get(index) ?? time;
        this._pressed.set(index, previous);
        if (time - previous > 1_000) {
          this._pressed = new Map();
          this.os.pop_scene();
          return;
        }
      }
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

  on_cancel = () => {
    this.os.pop_scene();
  };

  on_save = () => {};
}

function axis_to_offset(x: number) {
  return x * 30 + 50;
}

function standard_frame(
  handler: (index: number, element: UI.Widgetable) => UI.Widgetable = (_, x) =>
    x
) {
  return UI.h("div", { class: "standard-gamepad-frame" }, [
    UI.h("div", { class: "standard-gamepad-left standard-gamepad-cluster" }, [
      handler(
        12,
        UI.h(
          "div",
          {
            class: "standard-gamepad-button1 standard-gamepad-button",
            "data-index": "12",
          },
          []
        )
      ),
      handler(
        15,
        UI.h(
          "div",
          {
            class: "standard-gamepad-button2 standard-gamepad-button",
            "data-index": "15",
          },
          []
        )
      ),
      handler(
        13,
        UI.h(
          "div",
          {
            class: "standard-gamepad-button3 standard-gamepad-button",
            "data-index": "13",
          },
          []
        )
      ),
      handler(
        14,
        UI.h(
          "div",
          {
            class: "standard-gamepad-button4 standard-gamepad-button",
            "data-index": "14",
          },
          []
        )
      ),
    ]),
    UI.h("div", { class: "standard-gamepad-right standard-gamepad-cluster" }, [
      handler(
        3,
        UI.h(
          "div",
          {
            class: "standard-gamepad-button1 standard-gamepad-button",
            "data-index": "3",
          },
          []
        )
      ),
      handler(
        1,
        UI.h(
          "div",
          {
            class: "standard-gamepad-button2 standard-gamepad-button",
            "data-index": "1",
          },
          []
        )
      ),
      handler(
        0,
        UI.h(
          "div",
          {
            class: "standard-gamepad-button3 standard-gamepad-button",
            "data-index": "0",
          },
          []
        )
      ),
      handler(
        2,
        UI.h(
          "div",
          {
            class: "standard-gamepad-button4 standard-gamepad-button",
            "data-index": "2",
          },
          []
        )
      ),
    ]),
    handler(
      8,
      UI.h(
        "div",
        {
          class: "standard-gamepad-special standard-gamepad-special-left",
          "data-index": "8",
        },
        []
      )
    ),
    handler(
      16,
      UI.h(
        "div",
        {
          class: "standard-gamepad-special standard-gamepad-special-center",
          "data-index": "16",
        },
        []
      )
    ),
    handler(
      9,
      UI.h(
        "div",
        {
          class: "standard-gamepad-special standard-gamepad-special-right",
          "data-index": "9",
        },
        []
      )
    ),
    UI.h("div", { class: "standard-gamepad-axes standard-gamepad-axes-left" }, [
      handler(
        10,
        UI.h(
          "div",
          {
            class: "standard-gamepad-joystick",
            "data-axis-h": "0",
            "data-axis-v": "1",
            "data-index": "10",
          },
          []
        )
      ),
    ]),
    UI.h(
      "div",
      { class: "standard-gamepad-axes standard-gamepad-axes-right" },
      [
        handler(
          11,
          UI.h(
            "div",
            {
              class: "standard-gamepad-joystick",
              "data-axis-h": "2",
              "data-axis-v": "3",
              "data-index": "11",
            },
            []
          )
        ),
      ]
    ),
    UI.h(
      "div",
      { class: "standard-gamepad-shoulder standard-gamepad-shoulder-left" },
      [
        handler(
          6,
          UI.h(
            "div",
            {
              class:
                "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
              "data-index": "6",
            },
            []
          )
        ),
        handler(
          4,
          UI.h(
            "div",
            {
              class:
                "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
              "data-index": "4",
            },
            []
          )
        ),
      ]
    ),
    UI.h(
      "div",
      {
        class: "standard-gamepad-shoulder standard-gamepad-shoulder-right",
      },
      [
        handler(
          7,
          UI.h(
            "div",
            {
              class:
                "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
              "data-index": "7",
            },
            []
          )
        ),
        handler(
          5,
          UI.h(
            "div",
            {
              class:
                "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
              "data-index": "5",
            },
            []
          )
        ),
      ]
    ),
  ]);
}

const config_modes: ConfigMode[] = [
  {
    id: "d-pad",
    title: "D-Pad",
    active: [12, 13, 14, 15],
  },
  {
    id: "buttons",
    title: "Face buttons",
    active: [0, 1, 2, 3],
  },
  {
    id: "special",
    title: "Special buttons",
    active: [8, 9, 16],
  },
  {
    id: "shoulder",
    title: "Shoulder buttons",
    active: [4, 5, 6, 7],
  },
  {
    id: "axes",
    title: "Thumbsticks",
    active: [10, 11],
  },
];

type ConfigMode = {
  id: "d-pad" | "buttons" | "special" | "shoulder" | "axes";
  title: string;
  active: number[];
};

export class RemapStandardSettings extends UI.SimpleScene {
  private mode = new Observable<ConfigMode>(config_modes[0]);
  private _mapping: GamepadMapping[];

  constructor(os: KateOS) {
    super(os);
    this._mapping = os.settings.get("input").gamepad_mapping.standard;
  }

  icon = "gamepad";
  title = ["Remap buttons"];
  subtitle = UI.hbox(8, [
    UI.icon("ltrigger"),
    UI.dynamic(this.mode.map<UI.Widgetable>((x) => x.title)),
    UI.icon("rtrigger"),
  ]);

  actions: UI.Action[] = [
    {
      key: ["x"],
      label: "Return",
      handler: this.on_return,
    },
    {
      key: ["ltrigger"],
      label: "Previous button set",
      handler: () => {
        this.change_mode(-1);
      },
    },
    {
      key: ["rtrigger"],
      label: "Next button set",
      handler: () => {
        this.change_mode(1);
      },
    },
  ];

  private change_mode(offset: number) {
    const index = config_modes.findIndex((x) => x.id === this.mode.value.id);
    const new_index = clamp(index + offset, 0, config_modes.length - 1);
    if (new_index !== index) {
      this.mode.value = config_modes[new_index];
    }
  }

  private fill_button(button: HTMLElement) {
    const index = Number(button.getAttribute("data-index") ?? "nan");
    if (!isNaN(index)) {
      const entry = this._mapping.find(
        (x) => x.type === "button" && x.index === index
      ) as GamepadButtonToKate | null;
      if (entry != null) {
        UI.append(
          UI.h("div", { class: "gamepad-pressed-mapping" }, [
            UI.icon(entry.pressed),
          ]),
          button
        );
      }
    }

    return button;
  }

  body() {
    return [
      UI.h("div", { class: "gamepad-settings-remap-container" }, [
        UI.dynamic(
          this.mode.map<UI.Widgetable>((mode) => {
            return standard_frame((index, button) => {
              if (mode.active.includes(index)) {
                return UI.interactive(
                  this.os,
                  this.fill_button(button as HTMLElement),
                  [
                    {
                      key: ["o"],
                      label: "Remap",
                      on_click: true,
                      handler: () => this.remap(button as HTMLElement),
                    },
                  ],
                  {
                    replace: true,
                    default_focus_indicator: false,
                  }
                );
              } else {
                (button as HTMLElement).classList.add("inactive");
                return this.fill_button(button as HTMLElement);
              }
            });
          })
        ),
      ]),
    ];
  }

  on_attached(): void {
    super.on_attached();
    this.mode.stream.listen(() => {
      this.os.focus_handler.refocus();
    });
  }

  remap(button: HTMLElement) {}
}

type PairedGamepad = {
  id: string;
  active: number | null;
};

export class ChooseActiveGamepadSettings extends UI.SimpleScene {
  icon = "gamepad";
  title = ["Choose active gamepad"];

  actions: UI.Action[] = [
    {
      key: ["x"],
      label: "Cancel",
      handler: () => {
        this.on_return();
      },
    },
    {
      key: ["o"],
      label: "Save",
      handler: async () => {
        this.on_save();
      },
    },
  ];

  on_save = async () => {
    const paired = this._paired.value;
    if (paired == null) {
      return;
    }

    await this.os.settings.update("input", (x) => {
      return { ...x, paired_gamepad: paired.id };
    });
    await this.os.notifications.log(
      "kate:settings",
      "Updated paired gamepad",
      JSON.stringify(paired.id)
    );
    this.os.kernel.gamepad.pair(paired.id);
    this.os.pop_scene();
  };

  private _last_update: number | null = null;
  private _left_held_at: number | null = null;
  private _right_held_at: number | null = null;
  private _paired: Observable<PairedGamepad | null>;

  constructor(os: KateOS) {
    super(os);
    const paired = this.os.settings.get("input").paired_gamepad;
    this._paired = new Observable<PairedGamepad | null>(
      paired == null ? null : { id: paired, active: null }
    );
  }

  on_attached(): void {
    super.on_attached();
    this.os.kernel.console.on_tick.listen(this.update_gamepads);
    this.os.kernel.gamepad.pause();
  }

  on_detached(): void {
    this.os.kernel.console.on_tick.remove(this.update_gamepads);
    this.os.kernel.gamepad.unpause();
    super.on_detached();
  }

  update_gamepads = (time: number) => {
    const has_updated = (x: Gamepad | null) => {
      if (x == null) {
        return false;
      } else if (this._last_update == null) {
        return true;
      } else {
        return x.timestamp > this._last_update;
      }
    };

    const is_pairing = (gamepad: Gamepad) => {
      return gamepad.buttons[4].pressed || gamepad.buttons[5].pressed;
    };

    const all_gamepads = navigator
      .getGamepads()
      .filter((x) => x != null) as Gamepad[];
    const gamepad = all_gamepads
      .filter(has_updated)
      .filter(is_pairing)
      .sort((a, b) => b.timestamp - a.timestamp)[0] as Gamepad | null;

    if (gamepad != null) {
      if (
        gamepad.id !== this._paired.value?.id ||
        this._paired.value.active == null
      ) {
        this._paired.value = { id: gamepad.id, active: time };
      }
    } else if (
      this._paired.value != null &&
      this._paired.value.active != null
    ) {
      const active = this._paired.value.active;
      const elapsed = time - active;
      if (elapsed >= 1_000) {
        this._paired.value = { ...this._paired.value, active: null };
      }
    }

    const paired_update = all_gamepads
      .filter(has_updated)
      .find((x) => x.id === this._paired.value?.id);
    if (paired_update != null) {
      const is_left = (a: Gamepad) =>
        a.buttons[14].pressed ||
        a.buttons[2].pressed ||
        a.axes[0] < -0.5 ||
        a.axes[2] < -0.5;
      const is_right = (a: Gamepad) =>
        a.buttons[15].pressed ||
        a.buttons[1].pressed ||
        a.axes[0] > 0.5 ||
        a.axes[2] > 0.5;

      this._left_held_at = is_left(paired_update)
        ? this._left_held_at ?? time
        : null;
      this._right_held_at = is_right(paired_update)
        ? this._right_held_at ?? time
        : null;
    }

    if (this._left_held_at != null && time - this._left_held_at > 1_000) {
      this._left_held_at = null;
      this._right_held_at = null;
      this.on_return();
    } else if (
      this._right_held_at != null &&
      time - this._right_held_at > 1_000
    ) {
      this._right_held_at = null;
      this._right_held_at = null;
      this.on_save();
    }

    this._last_update = Math.max(...all_gamepads.map((x) => x.timestamp));
  };

  body() {
    const widgets = this._paired.map((x) => {
      if (x == null) {
        return UI.h(
          "div",
          {
            class:
              "gamepad-choose-controller gamepad-choose-controller-inactive",
          },
          [
            UI.h("div", { class: "gamepad-choose-controller-port" }, [
              "(No controller paired)",
            ]),
          ]
        );
      } else {
        return UI.h(
          "div",
          {
            class: "gamepad-choose-controller",
            "data-active": x.active != null,
          },
          [
            UI.fa_icon(
              "gamepad",
              "2x",
              "solid",
              x.active != null ? "bounce" : null
            ),
            UI.h("div", { class: "gamepad-choose-controller-name" }, [
              friendly_gamepad_id(x.id),
            ]),
          ]
        );
      }
    });

    return [
      UI.h("div", { class: "gamepad-choose-settings" }, [
        UI.h("div", { class: "gamepad-choose-message" }, [
          "Press",
          UI.icon("ltrigger"),
          "or",
          UI.icon("rtrigger"),
          "on the gamepad to pair with Kate.",
        ]),
        UI.h(
          "div",
          { class: "gamepad-choose-message", style: "font-size: 1rem" },
          [
            "On the paired gamepad, hold",
            UI.button_icon("dpad-right"),
            "to save, or",
            UI.button_icon("dpad-left"),
            "to return without changes.",
          ]
        ),
        UI.vspace(8),
        UI.dynamic(
          widgets.map<UI.Widgetable>((x) =>
            UI.h("div", { class: "gamepad-choose-paired" }, [x])
          )
        ),
      ]),
    ];
  }
}

/*
export class GamepadInputSettings0 extends UI.SimpleScene {
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
*/
