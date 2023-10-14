/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as UI from "../../ui";
import type { KateOS } from "../../os";
import { Deferred, Observable, clamp, enumerate, unreachable } from "../../../utils";
import { friendly_gamepad_id } from "../../../friendly/gamepad";
import {
  GamepadAxisToKate,
  GamepadButtonToKate,
  GamepadMapping,
  KateButton,
} from "../../../kernel";
import { InteractionHandler } from "../../apis";

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
    this.os.kernel.console.clock.on_tick.listen(this.update_gamepad_status);
    this.os.kernel.gamepad_source.pause();
    this.index_buttons();
    super.on_attached();
  }

  on_detached(): void {
    super.on_detached();
    this.os.kernel.gamepad_source.unpause();
    this.os.kernel.console.clock.on_tick.remove(this.update_gamepad_status);
  }

  index_buttons = () => {
    this._buttons = new Map();
    for (const button of Array.from(this.canvas.querySelectorAll("div[data-index]"))) {
      this._buttons.set(Number(button.getAttribute("data-index")), button as HTMLElement);
    }
    this._haxes = new Map();
    for (const axes of Array.from(this.canvas.querySelectorAll("div[data-axis-h]"))) {
      this._haxes.set(Number(axes.getAttribute("data-axis-h")), axes as HTMLElement);
    }
    this._vaxes = new Map();
    for (const axes of Array.from(this.canvas.querySelectorAll("div[data-axis-v]"))) {
      this._vaxes.set(Number(axes.getAttribute("data-axis-v")), axes as HTMLElement);
    }
  };

  update_gamepad_status = (time: number) => {
    const gamepad = this.os.kernel.gamepad_source.resolve_primary()?.resolve_raw();
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
          this.close();
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
    this.close();
  };

  on_save = () => {};
}

function axis_to_offset(x: number) {
  return x * 30 + 50;
}

function standard_frame(
  handler: (index: number, element: UI.Widgetable) => UI.Widgetable = (_, x) => x
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
            "data-name": "left thumbstick",
            "data-axis-h": "0",
            "data-axis-v": "1",
            "data-index": "10",
          },
          [
            UI.h("div", { class: "standard-gamepad-joystick-up" }, []),
            UI.h("div", { class: "standard-gamepad-joystick-down" }, []),
            UI.h("div", { class: "standard-gamepad-joystick-left" }, []),
            UI.h("div", { class: "standard-gamepad-joystick-right" }, []),
            UI.h("div", { class: "standard-gamepad-joystick-press" }, []),
          ]
        )
      ),
    ]),
    UI.h("div", { class: "standard-gamepad-axes standard-gamepad-axes-right" }, [
      handler(
        11,
        UI.h(
          "div",
          {
            class: "standard-gamepad-joystick",
            "data-name": "right thumbstick",
            "data-axis-h": "2",
            "data-axis-v": "3",
            "data-index": "11",
          },
          [
            UI.h("div", { class: "standard-gamepad-joystick-up" }, []),
            UI.h("div", { class: "standard-gamepad-joystick-down" }, []),
            UI.h("div", { class: "standard-gamepad-joystick-left" }, []),
            UI.h("div", { class: "standard-gamepad-joystick-right" }, []),
            UI.h("div", { class: "standard-gamepad-joystick-press" }, []),
          ]
        )
      ),
    ]),
    UI.h("div", { class: "standard-gamepad-shoulder standard-gamepad-shoulder-left" }, [
      handler(
        6,
        UI.h(
          "div",
          {
            class: "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
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
            class: "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
            "data-index": "4",
          },
          []
        )
      ),
    ]),
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
              class: "standard-gamepad-shoulder-button standard-gamepad-shoulder-button1",
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
              class: "standard-gamepad-shoulder-button standard-gamepad-shoulder-button2",
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
  private updated = new Observable<boolean>(false);
  private _mapping: GamepadMapping[];

  constructor(os: KateOS) {
    super(os);
    this._mapping = os.settings.get("input").gamepad_mapping.standard;
  }

  icon = "gamepad";
  title = ["Remap buttons"];
  subtitle = UI.hbox(0.5, [
    UI.icon("ltrigger"),
    UI.dynamic(this.mode.map<UI.Widgetable>((x) => x.title)),
    UI.icon("rtrigger"),
  ]);

  actions: UI.Action[] = [
    {
      key: ["x"],
      label: "Return",
      handler: () => this.on_return(),
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
    const index = this.button_index(button);
    if (index != null) {
      const entry = this._mapping.find(
        (x) => x.type === "button" && x.index === index
      ) as GamepadButtonToKate | null;
      if (entry != null) {
        UI.append(
          UI.h("div", { class: "gamepad-pressed-mapping" }, [UI.icon(entry.pressed)]),
          button
        );
      }
    }

    return button;
  }

  private fill_stick(button: HTMLElement) {
    const index = this.button_index(button);
    const haxis = Number(button.getAttribute("data-axis-h"));
    const vaxis = Number(button.getAttribute("data-axis-v"));

    const pressed_mapping = this._mapping.find(
      (x) => x.type === "button" && x.index === index
    ) as GamepadButtonToKate | null;
    const haxis_mapping = this._mapping.find(
      (x) => x.type === "axis" && x.index === haxis
    ) as GamepadAxisToKate | null;
    const vaxis_mapping = this._mapping.find(
      (x) => x.type === "axis" && x.index === vaxis
    ) as GamepadAxisToKate | null;

    UI.append(
      UI.h("div", { class: "gamepad-pressed-mapping" }, [
        pressed_mapping == null ? null : UI.icon(pressed_mapping.pressed),
      ]),
      button.querySelector(".standard-gamepad-joystick-press")!
    );

    UI.append(
      UI.h("div", { class: "gamepad-pressed-mapping" }, [
        haxis_mapping == null || haxis_mapping.negative == null
          ? null
          : UI.icon(haxis_mapping.negative),
      ]),
      button.querySelector(".standard-gamepad-joystick-left")!
    );
    UI.append(
      UI.h("div", { class: "gamepad-pressed-mapping" }, [
        haxis_mapping == null || haxis_mapping.positive == null
          ? null
          : UI.icon(haxis_mapping.positive),
      ]),
      button.querySelector(".standard-gamepad-joystick-right")!
    );

    UI.append(
      UI.h("div", { class: "gamepad-pressed-mapping" }, [
        vaxis_mapping == null || vaxis_mapping.negative == null
          ? null
          : UI.icon(vaxis_mapping.negative),
      ]),
      button.querySelector(".standard-gamepad-joystick-up")!
    );

    UI.append(
      UI.h("div", { class: "gamepad-pressed-mapping" }, [
        vaxis_mapping == null || vaxis_mapping.positive == null
          ? null
          : UI.icon(vaxis_mapping.positive),
      ]),
      button.querySelector(".standard-gamepad-joystick-down")!
    );
  }

  annotated_button(button: HTMLElement, interactive: boolean) {
    if (interactive) {
      return UI.interactive(
        this.os,
        this.fill_button(button as HTMLElement),
        [
          {
            key: ["o"],
            label: "Remap",
            on_click: true,
            handler: () => this.ask_remap_pressed(button as HTMLElement),
          },
        ],
        {
          replace: true,
          default_focus_indicator: false,
        }
      );
    } else {
      button.classList.add("inactive");
      return this.fill_button(button as HTMLElement);
    }
  }

  annotated_stick(button: HTMLElement, interactive: boolean) {
    this.fill_stick(button);
    if (!interactive) {
      button.classList.add("inactive");
    } else {
      const click: (_: () => void) => InteractionHandler = (fn: () => void) => {
        return {
          key: ["o"],
          on_click: true,
          label: "Remap",
          handler: fn,
        };
      };
      const interactive = (child: Node, fn: () => void) => {
        UI.interactive(this.os, child, [click(fn)], {
          replace: true,
        });
      };

      const up = button.querySelector(".standard-gamepad-joystick-up")!;
      const right = button.querySelector(".standard-gamepad-joystick-right")!;
      const down = button.querySelector(".standard-gamepad-joystick-down")!;
      const left = button.querySelector(".standard-gamepad-joystick-left")!;
      const press = button.querySelector(".standard-gamepad-joystick-press")!;

      interactive(press, () => this.ask_remap_pressed(button));
      interactive(up, () => this.ask_remap_axis(button, "up"));
      interactive(right, () => this.ask_remap_axis(button, "right"));
      interactive(down, () => this.ask_remap_axis(button, "down"));
      interactive(left, () => this.ask_remap_axis(button, "left"));
    }
    return button;
  }

  annotated_layout() {
    return UI.dynamic(
      this.mode.map<UI.Widgetable>((mode) => {
        return standard_frame((index, button0) => {
          const button = button0 as HTMLElement;
          const kind = button_kind(button as HTMLElement);
          switch (kind) {
            case "button":
              return this.annotated_button(button, mode.active.includes(index));
            case "stick":
              return this.annotated_stick(button, mode.active.includes(index));
            default:
              throw unreachable(kind);
          }
        });
      })
    );
  }

  body_container(body: UI.Widgetable[]): HTMLElement {
    return UI.h(
      "div",
      {
        class: "gamepad-settings-remap-container kate-os-content kate-os-screen-body",
      },
      [...body]
    );
  }

  body() {
    return [
      UI.h("div", { class: "gamepad-settings-remap-frame" }, [this.annotated_layout()]),
      UI.h("div", { class: "gamepad-settings-remap-actions" }, [
        UI.text_button(this.os, "Save", {
          primary: true,
          on_click: this.on_save,
          enabled: this.updated,
        }),
        UI.text_button(this.os, "Cancel", {
          on_click: () => this.on_return(),
        }),
        UI.text_button(this.os, "Defaults", {
          on_click: this.revert_defaults,
        }),
      ]),
    ];
  }

  revert_defaults = async () => {
    this._mapping = this.os.settings.defaults.input.gamepad_mapping.standard.slice();
    this.updated.value = true;
    this.refresh_mode();
  };

  on_return = async () => {
    if (this.updated.value) {
      const discard_confirm = await this.os.dialog.confirm("kate:settings", {
        title: "Discard changes?",
        message:
          "The changes made to the gamepad mapping have not been saved. Discard changes and leave the screen?",
        cancel: "Review changes",
        ok: "Discard changes",
        dangerous: true,
      });
      if (discard_confirm) {
        this.close();
      }
    } else {
      this.close();
    }
  };

  on_save = async () => {
    await this.os.settings.update("input", (x) => {
      const mapping = { ...x.gamepad_mapping, standard: this._mapping };
      return { ...x, gamepad_mapping: mapping };
    });
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "low",
      type: "kate.settings.gamepad.updated-standard-mapping",
      message: "Updated standard gamepad mapping",
      extra: this._mapping,
    });
    this.os.kernel.gamepad_source.remap(this._mapping);
    this.close();
  };

  on_attached(): void {
    super.on_attached();
    const frame = this.canvas.querySelector(".gamepad-settings-remap-frame") as HTMLElement;
    this.mode.stream.listen(() => {
      this.os.focus_handler.refocus(frame);
    });
  }

  private button_index(button: HTMLElement) {
    const index_string = button.getAttribute("data-index");
    if (index_string != null && !isNaN(Number(index_string))) {
      return Number(index_string);
    } else {
      return null;
    }
  }

  async ask_remap_axis(button: HTMLElement, direction: "left" | "right" | "up" | "down") {
    const clone = <A extends { [key: string]: any }>(x: A) => ({ ...x });

    const name = button.getAttribute("data-name") ?? "joystick";
    const haxis = Number(button.getAttribute("data-axis-h"));
    const vaxis = Number(button.getAttribute("data-axis-v"));
    const current_haxis = clone(
      (this._mapping.find(
        (x) => x.type === "axis" && x.index === haxis
      ) as GamepadAxisToKate | null) ?? {
        type: "axis" as const,
        index: haxis,
        negative: null,
        positive: null,
      }
    );
    const current_vaxis = clone(
      (this._mapping.find(
        (x) => x.type === "axis" && x.index === vaxis
      ) as GamepadAxisToKate | null) ?? {
        type: "axis" as const,
        index: vaxis,
        negative: null,
        positive: null,
      }
    );
    const message = `When ${name} is moved ${direction}`;
    const current =
      (direction === "left"
        ? current_haxis?.negative
        : direction === "right"
        ? current_haxis?.positive
        : direction === "up"
        ? current_vaxis?.negative
        : direction === "down"
        ? current_haxis?.positive
        : null) ?? null;
    const new_key = await this.remap(message, current);
    if (new_key === false) {
      return;
    }
    if (new_key !== current) {
      switch (direction) {
        case "left":
          current_haxis.negative = new_key;
          break;
        case "right":
          current_haxis.positive = new_key;
          break;
        case "up":
          current_vaxis.negative = new_key;
          break;
        case "down":
          current_vaxis.positive = new_key;
          break;
        default:
          throw unreachable(direction);
      }
      const mapping = this._mapping.filter(
        (x) => x.type !== "axis" || ![haxis, vaxis].includes(x.index)
      );
      this._mapping = mapping.concat([current_haxis, current_vaxis]);
      this.updated.value = true;
      this.refresh_mode();
    }
  }

  async ask_remap_pressed(button: HTMLElement) {
    const index = this.button_index(button);
    if (index != null) {
      const current = this._mapping.find(
        (x) => x.type === "button" && x.index === index
      ) as GamepadButtonToKate | null;
      const key = await this.remap(`When button ${index} is pressed`, current?.pressed ?? null);
      if (key === false) {
        return;
      }
      if (key !== current) {
        const mapping = this._mapping.filter((x) => x.type !== "button" || x.index !== index);
        const addition: GamepadMapping[] =
          key == null ? [] : [{ type: "button", index, pressed: key }];
        this._mapping = mapping.concat(addition);
        this.updated.value = true;
        this.refresh_mode();
      }
    }
  }

  async remap(title: string, current: KateButton | null) {
    let pressed = new Observable<null | KateButton>(current);
    const choose_pressed = (key: KateButton | null, title: string) => {
      const active = pressed.value === key ? "active" : "";
      return UI.interactive(
        this.os,
        UI.h("div", { class: `kate-key-button ${active}` }, [
          UI.h("div", { class: "kate-key-button-icon" }, [key == null ? null : UI.icon(key)]),
          UI.h("div", { class: "kate-key-button-title" }, [title]),
        ]),
        [
          {
            key: ["o"],
            on_click: true,
            label: "Select",
            handler: () => {
              if (pressed.value !== key) {
                pressed.value = key;
              }
            },
          },
        ],
        {
          focused: pressed.value === key,
        }
      );
    };

    const result: Deferred<boolean> = this.os.dialog.custom(
      "kate:settings",
      "gamepad-remap-dialog",
      [
        UI.h("div", { class: "gamepad-remap-dialog-contents" }, [
          UI.h("div", { class: "kate-hud-dialog-title" }, [title]),
          UI.dynamic(
            pressed.map<UI.Widgetable>((key) => {
              return UI.h("div", { class: "gamepad-remap-kate-buttons" }, [
                choose_pressed("up", "Up"),
                choose_pressed("right", "Right"),
                choose_pressed("down", "Down"),
                choose_pressed("left", "Left"),
                choose_pressed("o", "Ok"),
                choose_pressed("x", "Cancel"),
                choose_pressed("ltrigger", "L"),
                choose_pressed("rtrigger", "R"),
                choose_pressed("menu", "Menu"),
                choose_pressed("capture", "Capture"),
                choose_pressed(null, "None"),
              ]);
            })
          ),
        ]),
        UI.h("div", { class: "kate-hud-dialog-actions" }, [
          UI.h("div", { class: "kate-hud-dialog-action", "data-kind": "cancel" }, [
            UI.button("Discard", {
              on_clicked: () => {
                result.resolve(false);
              },
            }),
          ]),
          UI.h("div", { class: "kate-hud-dialog-action", "data-kind": "primary" }, [
            UI.button("Remap", {
              on_clicked: () => {
                result.resolve(true);
              },
            }),
          ]),
        ]),
      ],
      false
    );
    return result.promise.then((remap) => {
      if (remap) {
        return pressed.value;
      } else {
        return false;
      }
    });
  }

  private refresh_mode() {
    this.mode.value = this.mode.value;
  }
}

function button_kind(x: HTMLElement) {
  const pressable = x.hasAttribute("data-index");
  const haxis = x.hasAttribute("data-axis-h");
  const vaxis = x.hasAttribute("data-axis-v");

  return haxis && vaxis ? "stick" : "button";
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
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "low",
      type: "kate.settings.gamepad.updated-paired",
      message: "Updated paired gamepad",
      extra: { id: paired.id },
    });

    this.os.kernel.gamepad_source.set_primary(paired.id);
    this.close();
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
    this.os.kernel.console.clock.on_tick.listen(this.update_gamepads);
    this.os.kernel.gamepad_source.pause();
  }

  on_detached(): void {
    this.os.kernel.console.clock.on_tick.remove(this.update_gamepads);
    this.os.kernel.gamepad_source.unpause();
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

    const all_gamepads = navigator.getGamepads().filter((x) => x != null) as Gamepad[];
    const gamepad = all_gamepads
      .filter(has_updated)
      .filter(is_pairing)
      .sort((a, b) => b.timestamp - a.timestamp)[0] as Gamepad | null;

    if (gamepad != null) {
      if (gamepad.id !== this._paired.value?.id || this._paired.value.active == null) {
        this._paired.value = { id: gamepad.id, active: time };
      }
    } else if (this._paired.value != null && this._paired.value.active != null) {
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
        a.buttons[14].pressed || a.buttons[2].pressed || a.axes[0] < -0.5 || a.axes[2] < -0.5;
      const is_right = (a: Gamepad) =>
        a.buttons[15].pressed || a.buttons[1].pressed || a.axes[0] > 0.5 || a.axes[2] > 0.5;

      this._left_held_at = is_left(paired_update) ? this._left_held_at ?? time : null;
      this._right_held_at = is_right(paired_update) ? this._right_held_at ?? time : null;
    }

    if (this._left_held_at != null && time - this._left_held_at > 1_000) {
      this._left_held_at = null;
      this._right_held_at = null;
      this.on_return();
    } else if (this._right_held_at != null && time - this._right_held_at > 1_000) {
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
            class: "gamepad-choose-controller gamepad-choose-controller-inactive",
          },
          [UI.h("div", { class: "gamepad-choose-controller-port" }, ["(No controller paired)"])]
        );
      } else {
        return UI.h(
          "div",
          {
            class: "gamepad-choose-controller",
            "data-active": x.active != null,
          },
          [
            UI.fa_icon("gamepad", "2x", "solid", x.active != null ? "bounce" : null),
            UI.h("div", { class: "gamepad-choose-controller-name" }, [friendly_gamepad_id(x.id)]),
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
        UI.h("div", { class: "gamepad-choose-message", style: "font-size: 1rem" }, [
          "On the paired gamepad, hold",
          UI.button_icon("dpad-right"),
          "to save, or",
          UI.button_icon("dpad-left"),
          "to return without changes.",
        ]),
        UI.vspace(8),
        UI.dynamic(
          widgets.map<UI.Widgetable>((x) => UI.h("div", { class: "gamepad-choose-paired" }, [x]))
        ),
      ]),
    ];
  }
}
