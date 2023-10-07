/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export type KateKey =
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

const keys: KateKey[] = [
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

export type KeyState = {
  id: KateKey;
  pressed: boolean;
  count: number;
};

export class KateButtons {
  readonly state: Record<KateKey, KeyState> = {
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
  private changed = new Set<KateKey>();

  reset() {
    for (const key of keys) {
      this.state[key].pressed = false;
      this.state[key].count = 0 | 0;
      this.changed.add(key);
    }
  }

  force_reset(key: KateKey) {
    this.state[key].pressed = false;
    this.state[key].count = 0;
    this.changed.add(key);
  }

  update(key: KateKey, is_down: boolean) {
    if (this.state[key].pressed === is_down) {
      return;
    }

    this.changed.add(key);
    if (is_down) {
      this.state[key].pressed = true;
      this.state[key].count = 1 | 0;
    } else {
      this.state[key].pressed = false;
      this.state[key].count = -1 | 0;
    }
  }

  tick() {
    this.changed.clear();
    for (const key of keys) {
      const state = this.state[key];
      if (state.count !== 0) {
        state.count = (state.count + 1) | 0 || (state.pressed ? 2 : 0);
        this.changed.add(key);
      }
    }
  }

  get all_changed() {
    const result: KeyState[] = [];

    for (const key of this.changed) {
      result.push(this.state[key]);
    }

    return result;
  }

  is_pressed(key: KateKey) {
    return this.state[key].pressed;
  }

  is_just_pressed(key: KateKey) {
    return this.state[key].count === 1;
  }

  is_just_released(key: KateKey) {
    return this.state[key].count === -1;
  }

  frames_pressed(key: KateKey) {
    return this.state[key].count;
  }
}
