/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { h } from "../ui/widget";
import { Scene } from "../ui/scenes";

export class SceneBoot extends Scene {
  render() {
    return h("div", { class: "kate-os-logo" }, [
      h("div", { class: "kate-os-logo-image" }, [
        h("div", { class: "kate-os-logo-name" }, ["Kate"]),
        h("div", { class: "kate-os-boot-message" }, []),
      ]),
    ]);
  }

  set_message(message: string) {
    this.canvas.querySelector(".kate-os-boot-message")!.textContent = message;
  }
}
