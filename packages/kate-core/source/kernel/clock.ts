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
 */

import { EventStream } from "../utils";

export class KateConsoleClock {
  private _attached = false;
  private _timer_id: unknown = null;
  private _last_time: number | null = null;
  private _delay: number = 0;

  readonly on_tick = new EventStream<number>();

  readonly MAX_FPS = 30;
  readonly ONE_FRAME = Math.ceil(1000 / this.MAX_FPS);

  setup() {
    if (this._attached) {
      throw new Error(`[kernel:clock] setup() called twice`);
    }
    this._attached = true;
    this._timer_id = requestAnimationFrame(this.tick);
    console.debug(`[kate:clock] Initialised console clock`);
  }

  private tick = (time: number) => {
    if (this._last_time == null) {
      this._last_time = time;
      this._delay = 0;
      this.on_tick.emit(time);
      this._timer_id = requestAnimationFrame(this.tick);
      return;
    }

    const elapsed = time - this._last_time;
    this._delay = elapsed;

    if (elapsed < this.ONE_FRAME) {
      this._timer_id = requestAnimationFrame(this.tick);
    } else {
      this._last_time = time;
      this.on_tick.emit(time);
      this._timer_id = requestAnimationFrame(this.tick);
    }
  };

  get real_fps() {
    if (this._delay === 0) {
      return null;
    } else {
      return 1000 / this._delay;
    }
  }

  get fps() {
    return Math.min(this.MAX_FPS, this.real_fps ?? this.MAX_FPS);
  }
}
