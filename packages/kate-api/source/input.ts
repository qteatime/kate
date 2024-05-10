/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 *
 * This file is part of the cartridge linking exception as described
 * in COPYING.
 */

import { EventStream } from "./util";
import type { KateIPC } from "./channel";
import type { KateTimer } from "./timer";

export type InputKey =
  | "up"
  | "right"
  | "down"
  | "left"
  | "menu"
  | "capture"
  | "x"
  | "o"
  | "ltrigger"
  | "rtrigger"
  | "berry"
  | "sparkle";

export class KateInput {
  #channel: KateIPC;
  readonly on_key_pressed = new EventStream<{
    key: InputKey;
    is_repeat: boolean;
    is_long_press: boolean;
  }>();
  private _paused = false;
  private _state: Record<InputKey, number> = Object.assign(Object.create(null), {
    up: 0,
    right: 0,
    down: 0,
    left: 0,
    menu: 0,
    capture: 0,
    x: 0,
    o: 0,
    sparkle: 0,
    berry: 0,
    ltrigger: 0,
    rtrigger: 0,
  });
  private _changed: Set<InputKey> = new Set();
  private _keys: InputKey[] = Object.keys(this._state) as any;

  constructor(channel: KateIPC, private timer: KateTimer) {
    this.#channel = channel;
  }

  get is_paused() {
    return this._paused;
  }

  setup() {
    this.#channel.events.input_state_changed.listen(({ button: key, is_pressed: is_down }) => {
      if (!this._paused) {
        if (is_down) {
          if (this._state[key] <= 0) {
            this._changed.add(key);
          }
          this._state[key] = Math.max(1, this._state[key]);
        } else {
          if (this._state[key] > 0) {
            this._changed.add(key);
          }
          this._state[key] = -1;
        }
      }
    });
    this.#channel.events.paused.listen((state) => {
      this._paused = state;
      for (const key of this._keys) {
        this._state[key] = 0;
      }
    });
    this.#channel.events.key_pressed.listen((key) => this.on_key_pressed.emit(key));
    this.timer.on_tick.listen(this.update_key_state);
  }

  update_key_state = () => {
    for (const key of this._keys) {
      if (this._state[key] !== 0 && !this._changed.has(key)) {
        this._state[key] += 1;
        if (this._state[key] >= 65536) {
          this._state[key] = 2;
        }
      }
    }
    this._changed.clear();
  };

  is_pressed(key: InputKey) {
    return this._state[key] > 0;
  }

  frames_pressed(key: InputKey) {
    if (this._state[key] <= 0) {
      return 0;
    } else {
      return this._state[key];
    }
  }

  is_just_pressed(key: InputKey) {
    return this._state[key] === 1;
  }

  is_just_released(key: InputKey) {
    return this._state[key] === -1;
  }
}
