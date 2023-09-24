/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateTimer } from "./timer";
import { EventStream } from "./util";

export type PointerLocation = {
  x: number;
  y: number;
};

export type PointerClick = {
  location: PointerLocation;
  button: number;
};

export class KatePointerInput {
  readonly on_moved = new EventStream<PointerLocation>();
  readonly on_clicked = new EventStream<PointerClick>();
  readonly on_alternate = new EventStream<PointerClick>();
  readonly on_down = new EventStream<PointerClick>();
  readonly on_up = new EventStream<PointerClick>();

  private _started = false;
  private _location = {
    x: 0,
    y: 0,
  };
  private _buttons = new Map<number, number>();

  constructor(private timer: KateTimer) {}

  get x() {
    return this._location.x;
  }

  get y() {
    return this._location.y;
  }

  get location() {
    return { x: this.x, y: this.y };
  }

  frames_pressed(button: number) {
    return this._buttons.get(button) ?? 0;
  }

  is_pressed(button: number) {
    return (this._buttons.get(button) ?? 0) > 0;
  }

  is_just_pressed(button: number) {
    return (this._buttons.get(button) ?? 0) === 1;
  }

  is_just_released(button: number) {
    return (this._buttons.get(button) ?? 0) === -1;
  }

  monitor(cover: HTMLElement) {
    if (this._started) {
      throw new Error(`monitor() called twice`);
    }

    this._started = true;

    cover.addEventListener("mousemove", (ev) => {
      this._location.x = ev.pageX;
      this._location.y = ev.pageY;
      this.on_moved.emit({ x: ev.pageX, y: ev.pageY });
    });

    cover.addEventListener("mousedown", (ev) => {
      this._buttons.set(ev.button, 1);
      this.on_down.emit({
        location: this.location,
        button: ev.button,
      });
    });

    cover.addEventListener("mouseup", (ev) => {
      this._buttons.set(ev.button, -1);
      this.on_up.emit({
        location: this.location,
        button: ev.button,
      });
    });

    cover.addEventListener("click", (ev) => {
      ev.preventDefault();
      this.on_clicked.emit({
        location: this.location,
        button: ev.button,
      });
    });

    cover.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      this.on_alternate.emit({
        location: this.location,
        button: ev.button,
      });
    });

    this.timer.on_tick.listen(this.update_state);
  }

  update_state = () => {
    for (const [button, frames0] of this._buttons.entries()) {
      if (frames0 === 0) {
        continue;
      }

      let frames = Math.min(255, frames0 + 1);
      if (frames !== frames0) {
        this._buttons.set(button, frames);
      }
    }
  };
}
