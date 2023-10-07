/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { h } from "../ui/widget";
import * as UI from "../ui/widget";
import type { InputKey } from "../../kernel";
import { Scene } from "../ui/scenes";

export class SceneTextFile extends Scene {
  constructor(
    os: KateOS,
    private title: string,
    readonly app_title: string,
    readonly text: string
  ) {
    super(os, true);
  }

  render() {
    return h("div", { class: "kate-os-simple-screen" }, [
      new UI.Title_bar({
        left: UI.fragment([UI.fa_icon("circle-info", "lg"), new UI.Section_title([this.title])]),
        right: UI.text_ellipsis([this.app_title]),
      }),
      h("div", { class: "kate-os-text-scroll" }, [
        h("div", { class: "kate-os-padding" }, [this.text]),
      ]),
      h("div", { class: "kate-os-statusbar" }, [
        UI.icon_button("x", "Return").on_clicked(this.handle_close),
      ]),
    ]);
  }

  on_attached(): void {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  handle_key_pressed = (x: { key: InputKey; is_repeat: boolean }) => {
    const scroll = this.canvas.querySelector(".kate-os-text-scroll");
    if (scroll == null) {
      return false;
    }

    switch (x.key) {
      case "up": {
        scroll.scrollBy({ top: -350, behavior: "smooth" });
        return true;
      }
      case "down": {
        scroll.scrollBy({ top: 350, behavior: "smooth" });
        return true;
      }
      case "x": {
        if (!x.is_repeat) {
          this.handle_close();
          return true;
        }
      }
    }
    return false;
  };

  handle_close = () => {
    this.close();
  };
}
