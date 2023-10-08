/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Provides an input source for regularly attached gamepads. The default
// mapping is externally-reconfigurable so the OS can provide a way for
// the user to have their own custom mappings.
//
// Additionally, a particular gamepad might be set as the active one
// (i.e.: "the main player"), which is then generally used to control
// the console.

import { EventStream, unreachable } from "../../utils";
import { KateButton, buttons } from "./hardware-buttons";
import { ButtonChangeEvent, KateButtonInputSource } from "./input-source";

export type GamepadButtonToKate = {
  type: "button";
  index: number;
  pressed: KateButton;
};

export type GamepadAxisToKate = {
  type: "axis";
  index: number;
  negative: KateButton | null;
  positive: KateButton | null;
};

export type GamepadMapping = GamepadButtonToKate | GamepadAxisToKate;

export class KateGamepadInputSource implements KateButtonInputSource {
  readonly on_button_changed = new EventStream<ButtonChangeEvent>();

  private _attached = false;
  private _primary: string | null = null;
  private _gamepads: KateGamepadAdaptor[] = [];
  private _mapping: GamepadMapping[] = [];
  private _timer_id: unknown = null;

  setup() {
    if (this._attached) {
      throw new Error(`[kate:gamepad] setup() called twice.`);
    }

    this._attached = true;

    window.addEventListener("gamepadconnected", (ev) => {
      this.connect(ev.gamepad);
      this.schedule_update();
    });

    window.addEventListener("gamepaddisconnected", (ev) => {
      this.disconnect(ev.gamepad);
      this.schedule_update();
    });
  }

  private connect(gamepad: Gamepad) {
    const adaptor = this._gamepads.find((x) => x.is_same(gamepad));
    if (adaptor == null) {
      this._gamepads.push(new KateGamepadAdaptor(gamepad, this._mapping));
    }
  }

  private disconnect(gamepad: Gamepad) {
    this._gamepads = this._gamepads.filter((x) => !x.is_same(gamepad));
  }

  set_primary(id: string | null) {
    this._primary = id;
  }

  resolve_primary() {
    const primary = this._gamepads.find((x) => this._primary === x.device_id);
    if (primary != null) {
      return primary;
    } else {
      const active = this._gamepads.find((x) => x.is_active);
      return active ?? null;
    }
  }

  reset() {
    for (const gamepad of this._gamepads) {
      gamepad.reset();
    }
  }

  pause() {
    for (const gamepad of this._gamepads) {
      gamepad.pause();
    }
  }

  unpause() {
    for (const gamepad of this._gamepads) {
      gamepad.unpause();
    }
  }

  remap(mapping: GamepadMapping[]) {
    this._mapping = mapping;
    for (const gamepad of this._gamepads) {
      gamepad.remap(mapping);
    }
  }

  update = (time: number) => {
    const gamepad = this.resolve_primary();
    if (gamepad == null) {
      this._timer_id = requestAnimationFrame(this.update);
    } else {
      gamepad.update(time);
      for (const [button, is_pressed] of gamepad.changes) {
        this.on_button_changed.emit({ button, is_pressed });
      }
      this._timer_id = requestAnimationFrame(this.update);
    }
  };

  private schedule_update() {
    cancelAnimationFrame(this._timer_id as any);
    this._timer_id = null;
    if (this._gamepads.length > 0) {
      this._timer_id = requestAnimationFrame(this.update);
    }
  }
}

// NOTE: this is done as a bitset just to make the update loop cheaper
enum ButtonBit {
  up = 2 << 1,
  right = 2 << 2,
  down = 2 << 3,
  left = 2 << 4,
  o = 2 << 5,
  x = 2 << 6,
  sparkle = 2 << 7,
  ltrigger = 2 << 8,
  rtrigger = 2 << 9,
  berry = 2 << 10,
  capture = 2 << 11,
  menu = 2 << 12,
}

export class KateGamepadAdaptor {
  private _last_update: number | null = null;
  private _paused: boolean = false;
  private _state: ButtonBit | 0 = 0;
  private _changes: Map<KateButton, boolean> = new Map();

  constructor(private _raw_pad: Gamepad, private mapping: GamepadMapping[]) {}

  is_same(gamepad: Gamepad) {
    return this.id === gamepad.index;
  }

  get changes() {
    return this._changes;
  }

  get id() {
    return this._raw_pad.index;
  }

  get device_id() {
    return this._raw_pad.id;
  }

  get is_active() {
    return this.resolve_raw() != null;
  }

  resolve_raw() {
    const gamepads = navigator.getGamepads();
    return gamepads.find((x) => x?.connected && x?.index === this.id) ?? null;
  }

  remap(mapping: GamepadMapping[]) {
    this.mapping = mapping;
    this.reset();
  }

  pause() {
    this.reset();
    this._paused = true;
  }

  unpause() {
    this._paused = false;
  }

  reset() {
    this._changes.clear();
    this._state = 0;
  }

  update(time: number) {
    if (this._paused) {
      return;
    }

    this._changes.clear();
    const g = this.resolve_raw();
    if (g == null) {
      return;
    }
    if (this._last_update != null && this._last_update > g.timestamp) {
      return;
    }

    this._last_update = time;
    let new_state = 0;

    const add_change = (button: KateButton | null, is_pressed: boolean) => {
      if (button != null && is_pressed) {
        new_state = new_state | ButtonBit[button];
      }
    };

    for (const mapping of this.mapping) {
      const type = mapping.type;
      switch (type) {
        case "button": {
          add_change(mapping.pressed, g.buttons[mapping.index].pressed);
          break;
        }

        case "axis": {
          const axis = g.axes[mapping.index];
          if (axis < -0.5) {
            add_change(mapping.negative, true);
            add_change(mapping.positive, false);
          } else if (axis > 0.5) {
            add_change(mapping.negative, false);
            add_change(mapping.positive, true);
          } else {
            add_change(mapping.negative, false);
            add_change(mapping.positive, false);
          }
          break;
        }

        default:
          throw unreachable(type);
      }
    }

    const old_state = this._state;
    for (const button of buttons) {
      const state_before = old_state & ButtonBit[button];
      const state_after = new_state & ButtonBit[button];
      if (state_before !== state_after) {
        this._changes.set(button, state_after !== 0);
      }
    }

    this._state = new_state;
  }
}
