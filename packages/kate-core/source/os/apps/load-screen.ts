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

import { h } from "../ui/widget";
import { Scene } from "../ui/scenes";
import type { KateOS } from "../os";

export class HUD_LoadIndicator extends Scene {
  readonly application_id = "kate:loading";

  constructor(os: KateOS) {
    super(os, true);
    this.canvas.classList.add("upscaled");
  }

  render() {
    return h("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
  }
}
