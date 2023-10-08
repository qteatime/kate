/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Handles all the underlying Kate-specific input, except for the OS-specific
// parts (e.g.: long-presses, repeats), which will have configurations
// elsewhere.

export type KateButton =
  | "up"
  | "right"
  | "down"
  | "left"
  | "o"
  | "x"
  | "sparkle"
  | "berry"
  | "menu"
  | "capture"
  | "ltrigger"
  | "rtrigger";

export const buttons: KateButton[] = [
  "up",
  "right",
  "down",
  "left",
  "o",
  "x",
  "sparkle",
  "berry",
  "menu",
  "capture",
  "ltrigger",
  "rtrigger",
];

export type ButtonState = {
  id: KateButton;
  pressed: boolean;
  count: number;
};

export class KateButtons {
  readonly state: Record<KateButton, ButtonState> = {
    up: { id: "up", pressed: false, count: 0 | 0 },
    right: { id: "right", pressed: false, count: 0 | 0 },
    down: { id: "down", pressed: false, count: 0 | 0 },
    left: { id: "left", pressed: false, count: 0 | 0 },
    o: { id: "o", pressed: false, count: 0 | 0 },
    x: { id: "x", pressed: false, count: 0 | 0 },
    sparkle: { id: "sparkle", pressed: false, count: 0 | 0 },
    berry: { id: "berry", pressed: false, count: 0 | 0 },
    capture: { id: "capture", pressed: false, count: 0 | 0 },
    menu: { id: "menu", pressed: false, count: 0 | 0 },
    ltrigger: { id: "ltrigger", pressed: false, count: 0 | 0 },
    rtrigger: { id: "rtrigger", pressed: false, count: 0 | 0 },
  };
  private changed = new Set<KateButton>();

  reset() {
    for (const button of buttons) {
      this.state[button].pressed = false;
      this.state[button].count = 0 | 0;
      this.changed.add(button);
    }
  }

  force_reset(button: KateButton) {
    this.state[button].pressed = false;
    this.state[button].count = 0;
    this.changed.add(button);
  }

  update(button: KateButton, is_pressed: boolean) {
    if (this.state[button].pressed === is_pressed) {
      return;
    }

    this.changed.add(button);
    if (is_pressed) {
      this.state[button].pressed = true;
      this.state[button].count = 1 | 0;
    } else {
      this.state[button].pressed = false;
      this.state[button].count = -1 | 0;
    }
  }

  tick() {
    this.changed.clear();
    for (const button of buttons) {
      const state = this.state[button];
      if (state.count !== 0) {
        state.count = (state.count + 1) | 0 || (state.pressed ? 2 : 0);
        this.changed.add(button);
      }
    }
  }

  get all_changed() {
    const result: ButtonState[] = [];

    for (const button of this.changed) {
      result.push(this.state[button]);
    }

    return result;
  }

  is_pressed(button: KateButton) {
    return this.state[button].pressed;
  }

  is_just_pressed(button: KateButton) {
    return this.state[button].count === 1;
  }

  is_just_released(button: KateButton) {
    return this.state[button].count === -1;
  }

  frames_pressed(button: KateButton) {
    return this.state[button].count;
  }
}
