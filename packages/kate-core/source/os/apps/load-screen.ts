/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { h } from "../ui/widget";
import { Scene } from "../ui/scenes";
import type { KateOS } from "../os";

export class HUD_LoadIndicator extends Scene {
  constructor(os: KateOS) {
    super(os, true);
  }

  render() {
    return h("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
  }
}
