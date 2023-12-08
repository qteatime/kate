/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Aggregates all button input sources and feed them into the hardware
// state, then exposes this under a single interface while also handling
// software things such as "repeat presses" and "long presses".

import { EventStream } from "../../utils";
import { ButtonState, KateButton, KateButtons } from "./hardware-buttons";
import { KateGamepadInputSource } from "./input-source-gamepad";
import { KateKeyboardInputSource } from "./input-source-keyboard";
import { KateVirtualInputSource } from "./input-source-virtual";
import type { ButtonChangeEvent } from "./input-source";

export type ButtonPressedEvent = {
  key: KateButton;
  is_repeat: boolean;
  is_long_press: boolean;
};

export class KateButtonInputAggregator {
  private _attached = false;

  readonly on_state_changed = new EventStream<ButtonChangeEvent>();
  readonly on_button_pressed = new EventStream<ButtonPressedEvent>();

  readonly state = new KateButtons();
  readonly virtual_source = new KateVirtualInputSource();
  readonly gamepad_source = new KateGamepadInputSource();
  readonly keyboard_source = new KateKeyboardInputSource();

  readonly SPECIAL_FRAMES = 15;
  readonly REPEAT_FRAMES = 10;
  readonly REPEAT_RATE = 3;

  setup(root: HTMLElement) {
    if (this._attached) {
      throw new Error(`[kate:button-input] setup() called twice.`);
    }
    this._attached = true;

    this.virtual_source.setup(root);
    this.gamepad_source.setup();
    this.keyboard_source.setup();
    this.virtual_source.on_button_changed.listen((ev) =>
      this.update_button(ev.button, ev.is_pressed)
    );
    this.gamepad_source.on_button_changed.listen((ev) =>
      this.update_button(ev.button, ev.is_pressed)
    );
    this.keyboard_source.on_button_changed.listen((ev) =>
      this.update_button(ev.button, ev.is_pressed)
    );
  }

  reset() {
    this.state.reset();
    this.virtual_source.reset();
    this.gamepad_source.reset();
  }

  update(time: number) {
    for (const key of this.state.all_changed) {
      this.virtual_source.update(key.id, key.pressed);
      if (key.count === 1 || key.count === -1) {
        this.on_state_changed.emit({ button: key.id, is_pressed: key.pressed });
      }
      this.handle_button_pressed(key);
    }
  }

  tick() {
    this.state.tick();
  }

  private update_button(button: KateButton, state: boolean) {
    this.state.update(button, state);
    this.virtual_source.update(button, state);
  }

  private handle_button_pressed(key: ButtonState) {
    const is_special = key.id === "capture";
    const is_just_released = key.count === -1;
    const is_just_pressed = key.count === 1;
    const is_long_press = key.count > 0 && key.count % this.SPECIAL_FRAMES === 0;
    const is_repeat =
      key.count >= this.REPEAT_FRAMES && (key.count - this.REPEAT_FRAMES) % this.REPEAT_RATE === 0;

    if (is_special) {
      if (is_long_press) {
        this.on_button_pressed.emit({ key: key.id, is_repeat: false, is_long_press: true });
        this.state.force_reset("capture");
      } else if (is_just_released) {
        this.on_button_pressed.emit({ key: key.id, is_repeat: false, is_long_press: false });
      }
    } else if (is_just_pressed || is_repeat) {
      this.on_button_pressed.emit({
        key: key.id as any,
        is_repeat: is_repeat,
        is_long_press: false,
      });
    }
  }
}
