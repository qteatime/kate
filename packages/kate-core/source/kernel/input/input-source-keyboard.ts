/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
  private ignore_repeat = ["menu", "capture"];
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

    document.addEventListener("keydown", (ev) => {
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
    });

    document.addEventListener("keyup", (ev) => {
      if (ev.code in this.physical_map) {
        ev.preventDefault();
        const button = this.physical_map[ev.code];
        if (button != null) {
          this.on_button_changed.emit({ button, is_pressed: false });
        } else {
          console.warn(`[kate:keyboard] Unmapped key:`, ev.code);
        }
      }
    });
  }
}
