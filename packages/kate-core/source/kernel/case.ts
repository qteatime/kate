/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventStream, clamp, unreachable } from "../utils";
import type { InputKey } from "./virtual";

type Direction = "up" | "right" | "down" | "left";

const enum Dpad {
  IDLE = 0,
  UP = 2 << 0,
  RIGHT = 2 << 1,
  DOWN = 2 << 2,
  LEFT = 2 << 3,
  UP_RIGHT = (2 << 0) | (2 << 1),
  UP_LEFT = (2 << 0) | (2 << 3),
  DOWN_RIGHT = (2 << 2) | (2 << 1),
  DOWN_LEFT = (2 << 2) | (2 << 3),
}

// FIXME: converge
const keys: InputKey[] = [
  "up",
  "right",
  "down",
  "left",
  "o",
  "x",
  "menu",
  "capture",
  "ltrigger",
  "rtrigger",
];

export type VirtualInputChange = {
  key: InputKey;
  is_down: boolean;
};

export abstract class KateCase {
  abstract reset(): void;
  abstract update(button: InputKey, is_down: boolean): void;
  abstract setup(): void;
  abstract teardown(): void;
  abstract on_virtual_change: EventStream<VirtualInputChange>;
}

export class KateMobileCase extends KateCase {
  readonly on_virtual_change = new EventStream<VirtualInputChange>();

  private thumb_direction: Dpad = Dpad.IDLE;
  private thumb_range: number;
  private moving_thumb: boolean = false;
  private dpad: HTMLElement;
  private dpad_thumb: HTMLElement;

  private btn_ok: HTMLElement;
  private btn_cancel: HTMLElement;
  private btn_sparkle: HTMLElement;
  private btn_menu: HTMLElement;
  private btn_capture: HTMLElement;
  private btn_berry: HTMLElement;
  private btn_l: HTMLElement;
  private btn_r: HTMLElement;

  private subscriptions: { button: HTMLElement; event: string; listener: unknown }[] = [];

  constructor(private root: HTMLElement) {
    super();

    this.dpad = root.querySelector(".kc-dpad")!;
    this.dpad_thumb = root.querySelector(".kc-thumb")!;
    this.thumb_range = Number(this.dpad_thumb.getAttribute("data-range"));
    if (Number.isNaN(this.thumb_range) || Math.trunc(this.thumb_range) !== this.thumb_range) {
      throw new Error(`[internal] Invalid data-range for dpad thumbstick`);
    }

    this.btn_ok = root.querySelector(".kc-ok")!;
    this.btn_cancel = root.querySelector(".kc-cancel")!;
    this.btn_sparkle = root.querySelector(".kc-sparkle")!;

    this.btn_menu = root.querySelector(".kc-menu")!;
    this.btn_capture = root.querySelector(".kc-capture")!;
    this.btn_berry = root.querySelector(".kc-berry")!;

    this.btn_l = root.querySelector(".kc-shoulder-left")!;
    this.btn_r = root.querySelector(".kc-shoulder-right")!;
  }

  override setup(): void {
    this.listen_virtual_button(this.btn_ok, "o");
    this.listen_virtual_button(this.btn_cancel, "x");
    this.listen_virtual_button(this.btn_sparkle, "sparkle");
    this.listen_virtual_button(this.btn_menu, "menu");
    this.listen_virtual_button(this.btn_capture, "capture");
    this.listen_virtual_button(this.btn_berry, "berry");
    this.listen_virtual_button(this.btn_l, "ltrigger");
    this.listen_virtual_button(this.btn_r, "rtrigger");
    this.listen_thumb();
  }

  override teardown(): void {
    for (const { button, event, listener } of this.subscriptions) {
      button.removeEventListener(event, listener as any);
    }
    this.subscriptions = [];
  }

  private listen_thumb() {
    const area = this.dpad;
    const thumb = this.dpad_thumb;
    let moving: unknown = null;
    const thumb_center_x = thumb.offsetWidth / 2 + thumb.offsetLeft;
    const thumb_center_y = thumb.offsetHeight / 2 + thumb.offsetTop;
    const range = this.thumb_range;

    const on_down = (ev: PointerEvent) => {
      ev.preventDefault();
      moving = ev.pointerId;
      this.moving_thumb = true;
    };

    const on_up = (ev: PointerEvent) => {
      ev.preventDefault();

      if (ev.pointerId === moving) {
        moving = false;
        this.on_virtual_change.emit({ key: "up", is_down: false });
        this.on_virtual_change.emit({ key: "right", is_down: false });
        this.on_virtual_change.emit({ key: "down", is_down: false });
        this.on_virtual_change.emit({ key: "left", is_down: false });
        thumb.style.translate = `0px 0px`;
        this.moving_thumb = false;
      }
    };

    const on_move = (ev: PointerEvent) => {
      ev.preventDefault();
      if (ev.pointerId === moving) {
        const x = ev.offsetX - thumb_center_x;
        const y = ev.offsetY - thumb_center_y;
        const clamp_x = Math.floor(clamp(x, -range, range));
        const clamp_y = Math.floor(clamp(y, -range, range));
        thumb.style.translate = `${clamp_x}px ${clamp_y}px`;
        const move_y = clamp_y / 20;
        const move_x = clamp_x / 20;
        this.on_virtual_change.emit({ key: "up", is_down: move_y <= -0.5 });
        this.on_virtual_change.emit({ key: "right", is_down: move_x >= 0.5 });
        this.on_virtual_change.emit({ key: "down", is_down: move_y >= 0.5 });
        this.on_virtual_change.emit({ key: "left", is_down: move_x <= -0.5 });
      }
    };

    area.addEventListener("pointerdown", on_down);
    this.root.addEventListener("pointerup", on_up);
    area.addEventListener("pointermove", on_move);

    this.subscriptions.push(
      { button: area, event: "pointerdown", listener: on_down },
      { button: this.root, event: "pointerup", listener: on_up },
      { button: area, event: "pointermove", listener: on_move }
    );
  }

  private listen_virtual_button(button: HTMLElement, key: InputKey) {
    const on_down = (ev: MouseEvent | TouchEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.on_virtual_change.emit({ key, is_down: true });
    };
    const on_up = (ev: MouseEvent | TouchEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.on_virtual_change.emit({ key, is_down: false });
    };

    button.addEventListener("mousedown", on_down);
    button.addEventListener("mouseup", on_up);
    button.addEventListener("touchstart", on_down);
    button.addEventListener("touchend", on_up);

    this.subscriptions.push(
      { button, event: "mousedown", listener: on_down },
      { button, event: "mouseup", listener: on_up },
      { button, event: "touchstart", listener: on_down },
      { button, event: "touchend", listener: on_up }
    );
  }

  override reset() {
    for (const key of keys) {
      this.update(key, false);
    }
  }

  override update(button: InputKey, is_down: boolean) {
    switch (button) {
      case "up":
      case "down":
      case "left":
      case "right":
        this.update_thumb(button, is_down);
        break;

      case "capture":
        this.update_button(this.btn_capture, is_down);
        break;

      case "menu":
        this.update_button(this.btn_menu, is_down);
        break;

      case "o":
        this.update_button(this.btn_ok, is_down);
        break;

      case "x":
        this.update_button(this.btn_cancel, is_down);
        break;

      case "ltrigger":
        this.update_button(this.btn_l, is_down);
        break;

      case "rtrigger":
        this.update_button(this.btn_r, is_down);
        break;

      case "berry":
        this.update_button(this.btn_berry, is_down);
        break;

      case "sparkle":
        this.update_button(this.btn_sparkle, is_down);
        break;

      default:
        throw unreachable(button);
    }
  }

  update_button(button: HTMLElement, is_down: boolean) {
    button.classList.toggle("down", is_down);
  }

  update_thumb(direction: Direction, is_down: boolean) {
    this.move_thumb(direction, is_down);
    if (!this.moving_thumb) {
      this.dpad_thumb.style.translate = this.thumb_translate;
    }
  }

  private move_thumb(direction: Direction, is_down: boolean) {
    const bit = this.direction_to_bit(direction);
    if (is_down) {
      this.thumb_direction = this.thumb_direction | bit;
    } else {
      this.thumb_direction = this.thumb_direction & ~bit;
    }
  }

  private direction_to_bit(direction: Direction) {
    switch (direction) {
      case "up":
        return Dpad.UP;
      case "right":
        return Dpad.RIGHT;
      case "down":
        return Dpad.DOWN;
      case "left":
        return Dpad.LEFT;
      default:
        throw unreachable(direction);
    }
  }

  get thumb_translate() {
    const range = this.thumb_range;

    switch (this.thumb_direction) {
      case Dpad.UP_LEFT:
        return `${-range}px ${-range}px`;
      case Dpad.UP:
        return `0px ${-range}px`;
      case Dpad.UP_RIGHT:
        return `${range}px ${-range}px`;
      case Dpad.RIGHT:
        return `${range}px 0px`;
      case Dpad.DOWN_RIGHT:
        return `${range}px ${range}px`;
      case Dpad.DOWN:
        return `0px ${range}px`;
      case Dpad.DOWN_LEFT:
        return `${-range}px ${range}px`;
      case Dpad.LEFT:
        return `${-range}px 0px`;
      default:
        return "0px 0px";
    }
  }
}
