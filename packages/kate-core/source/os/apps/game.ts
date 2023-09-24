/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { h } from "../ui/widget";
import type { ExtendedInputKey } from "../../kernel";
import type { KateProcess } from "../apis/processes";
import { Scene } from "../ui/scenes";

export class SceneGame extends Scene {
  constructor(os: KateOS, readonly process: () => KateProcess) {
    super(os, false);
  }

  on_attached(): void {
    this.os.focus_handler.on_focus_changed.listen(this.handle_focus_changed);
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  on_detached(): void {
    this.os.focus_handler.on_focus_changed.remove(this.handle_focus_changed);
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  handle_key_pressed = (x: { key: ExtendedInputKey; is_repeat: boolean }) => {
    return true;
  };

  handle_focus_changed = (focus: HTMLElement | null) => {
    if (focus === this.canvas) {
      setTimeout(() => {
        this.process().unpause();
      });
    } else {
      this.process().pause();
    }
  };

  focus_frame = (ev: Event) => {
    ev.preventDefault();
    const node = this.process().runtime.node;
    if (node instanceof HTMLIFrameElement) {
      node.focus();
    }
  };

  render() {
    return h("div", { class: "kate-os-game" }, [this.process().runtime.node]);
  }
}
