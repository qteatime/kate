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

// Provides an input source for regularly attached keyboards. The default
// mapping is externally-reconfigurable so the OS can provide a way for
// the user to have their own custom mappings.

import { EventStream } from "../../utils";
import { KateButton } from "./hardware-buttons";
import { ButtonChangeEvent, KateButtonInputSource } from "./input-source";

const default_config: Record<KateButton, string> = {
  up: "ArrowUp",
  right: "ArrowRight",
  down: "ArrowDown",
  left: "ArrowLeft",
  menu: "ShiftLeft",
  capture: "KeyF",
  x: "KeyX",
  o: "KeyZ",
  ltrigger: "KeyA",
  rtrigger: "KeyS",
  berry: "KeyQ",
  sparkle: "KeyC",
};

const default_mapping: Record<string, KateButton> = Object.assign(
  Object.create(null),
  Object.fromEntries(Object.entries(default_config).map(([button, kbd]) => [kbd, button]))
);

export class KateKeyboardInputSource implements KateButtonInputSource {
  readonly on_button_changed = new EventStream<ButtonChangeEvent>();
  private ignore_repeat = ["menu", "capture", "berry"];
  private physical_map: { [key: string]: KateButton | null } = default_mapping;
  private attached = false;

  remap(mapping: { key: string; button: KateButton }[]) {
    const map: { [key: string]: KateButton } = Object.create(null);
    for (const { key, button } of mapping) {
      map[key] = button;
    }
    this.physical_map = map;
  }

  setup() {
    if (this.attached) {
      throw new Error(`[kate:keyboard] setup() called twice`);
    }
    this.attached = true;
    document.addEventListener("keydown", this.handle_keydown);
    document.addEventListener("keyup", this.handle_keyup);
    console.debug(`[kate:keyboard] Initialised keyboard adaptor`);
  }

  teardown() {
    if (!this.attached) {
      throw new Error(`[kate:keyboard] teardown() called without setup`);
    }
    document.removeEventListener("keydown", this.handle_keydown);
    document.removeEventListener("keyup", this.handle_keyup);
    this.attached = false;
    console.debug(`[kate:sandbox] Disabled keyboard adaptor`);
  }

  private handle_keydown = (ev: KeyboardEvent) => {
    if (ev.code in this.physical_map) {
      ev.preventDefault();
      const button = this.physical_map[ev.code];
      if (button != null) {
        if (!this.ignore_repeat.includes(button) || !ev.repeat) {
          this.on_button_changed.emit({ button, is_pressed: true });
        }
      } else {
        console.warn(`[kate:keyboard] Unmapped key:`, ev.code);
      }
    }
  };

  private handle_keyup = (ev: KeyboardEvent) => {
    if (ev.code in this.physical_map) {
      ev.preventDefault();
      const button = this.physical_map[ev.code];
      if (button != null) {
        this.on_button_changed.emit({ button, is_pressed: false });
      } else {
        console.warn(`[kate:keyboard] Unmapped key:`, ev.code);
      }
    }
  };
}
