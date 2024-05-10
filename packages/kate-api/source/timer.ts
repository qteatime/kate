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

export class KateTimer {
  readonly on_tick = new EventStream<number>();
  private _last_time: number | null = null;
  private _timer_id: number | null = null;
  readonly MAX_FPS = 30;
  readonly ONE_FRAME = Math.ceil(1000 / 30);
  private _fps = 30;

  setup() {
    cancelAnimationFrame(this._timer_id as any);
    this._last_time = null;
    this._timer_id = requestAnimationFrame(this.tick);
  }

  get fps() {
    return this._fps;
  }

  private tick = (time: number) => {
    if (this._last_time == null) {
      this._last_time = time;
      this._fps = this.MAX_FPS;
      this.on_tick.emit(time);
      this._timer_id = requestAnimationFrame(this.tick);
    } else {
      const elapsed = time - this._last_time;
      if (elapsed < this.ONE_FRAME) {
        this._timer_id = requestAnimationFrame(this.tick);
      } else {
        this._last_time = time;
        this._fps = (1000 / elapsed) | 0;
        this.on_tick.emit(time);
        this._timer_id = requestAnimationFrame(this.tick);
      }
    }
  };
}
