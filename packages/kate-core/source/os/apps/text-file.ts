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
import * as UI from "../ui/widget";
import { Scene } from "../ui/scenes";
import { KateButton } from "../../kernel";

export class SceneTextFile extends Scene {
  readonly application_id = "kate:view-document";

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

  handle_key_pressed = (x: { key: KateButton; is_repeat: boolean }) => {
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
