/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
