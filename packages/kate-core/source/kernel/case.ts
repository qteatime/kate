/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { unreachable } from "../utils";
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

export abstract class KateCase {
  abstract reset(): void;
  abstract update(button: InputKey, is_down: boolean): void;
}

export class KateMobileCase extends KateCase {
  private thumb_direction: Dpad = Dpad.IDLE;
  private thumb_range: number;
  private dpad_thumb: HTMLElement;
  private btn_ok: HTMLElement;
  private btn_cancel: HTMLElement;
  private btn_sparkle: HTMLElement;
  private btn_menu: HTMLElement;
  private btn_capture: HTMLElement;
  private btn_berry: HTMLElement;
  private btn_l: HTMLElement;
  private btn_r: HTMLElement;

  constructor(private root: HTMLElement) {
    super();

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
    this.dpad_thumb.style.translate = this.thumb_translate;
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
