/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { h } from "../ui/widget";
import { Scene } from "../ui/scenes";
import { ButtonChangeEvent, ButtonPressedEvent, KateButton, Process } from "../../kernel";

export class SceneGame extends Scene {
  get application_id(): string {
    return this.process.cartridge.id;
  }

  get input() {
    return this.os.kernel.console.button_input;
  }

  get is_active() {
    return this.process.is_paired && !this.process.is_paused;
  }

  constructor(os: KateOS, readonly process: Process) {
    super(os, false);
  }

  on_attached(): void {
    this.os.focus_handler.on_focus_changed.listen(this.handle_focus_changed);
    this.os.focus_handler.listen(this.canvas, this.handle_focus_key_pressed);
    this.input.on_state_changed.listen(this.handle_state_changed);
    this.input.on_button_pressed.listen(this.handle_button_pressed);
  }

  on_detached(): void {
    this.os.focus_handler.on_focus_changed.remove(this.handle_focus_changed);
    this.os.focus_handler.listen(this.canvas, this.handle_focus_key_pressed);
    this.input.on_state_changed.remove(this.handle_state_changed);
    this.input.on_button_pressed.remove(this.handle_button_pressed);
  }

  handle_state_changed = (ev: ButtonChangeEvent) => {
    if (this.is_active) {
      this.process.send({ type: "kate:input-state-changed", payload: ev });
    }
  };

  handle_button_pressed = (ev: ButtonPressedEvent) => {
    if (this.is_active) {
      this.process.send({ type: "kate:input-key-pressed", payload: ev });
    }
  };

  handle_focus_key_pressed = (x: { key: KateButton; is_repeat: boolean }) => {
    return true;
  };

  handle_focus_changed = (focus: HTMLElement | null) => {
    if (focus === this.canvas) {
      setTimeout(() => {
        this.process.unpause();
      });
    } else {
      this.process.pause();
    }
  };

  focus_frame = (ev: Event) => {
    ev.preventDefault();
    const node = this.process.frame;
    node.focus();
  };

  render() {
    return h("div", { class: "kate-os-game" }, [this.process.frame]);
  }
}
