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

import type { KateOS } from "../os";
import { h } from "../ui/widget";
import { Scene } from "../ui/scenes";
import { ButtonChangeEvent, ButtonPressedEvent, KateButton, Process } from "../../kernel";

export class SceneGame extends Scene {
  private is_recording;

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
    this.is_recording = false;
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
      switch (ev.key) {
        case "berry":
          break;

        case "capture": {
          const token = this.os.ipc.initiate_capture(this.process);
          if (ev.is_long_press && !this.is_recording) {
            this.process.send({ type: "kate:start-recording", token: token });
            this.is_recording = true;
          } else if (ev.is_long_press && this.is_recording) {
            this.process.send({ type: "kate:stop-recording" });
            this.is_recording = false;
          } else {
            this.process.send({ type: "kate:take-screenshot", token: token });
          }
          break;
        }

        default:
          this.process.send({ type: "kate:input-key-pressed", payload: ev });
      }
    }
  };

  handle_focus_key_pressed = (x: { key: KateButton; is_repeat: boolean }) => {
    return true;
  };

  handle_focus_changed = (focus: HTMLElement | null) => {
    if (!this.process.is_paired) {
      return;
    }

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
