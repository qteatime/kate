/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { Scene } from "../ui/scenes";
import * as UI from "../ui";

export class KateDropInstaller {
  readonly hud: HUD_DropInstaller;
  constructor(readonly os: KateOS) {
    this.hud = new HUD_DropInstaller(this);
  }

  setup() {
    this.hud.setup();
  }

  async install(files: File[]) {
    const valid = files.filter((x) => x.name.endsWith(".kart"));
    const status = this.os.status_bar.show(`Installing ${files.length} carts...`);

    for (const file of valid) {
      if (!file.name.endsWith(".kart")) {
        continue;
      }

      status.update(`Installing ${file.name}...`);
      await this.os.cart_manager.install_from_file(file);
    }

    status.hide();
  }
}

export class HUD_DropInstaller extends Scene {
  constructor(readonly manager: KateDropInstaller) {
    super(manager.os, true);
    (this as any).canvas = UI.h("div", { class: "kate-hud-drop-installer" }, []);
  }

  setup() {
    this.manager.os.show_hud(this);
    const screen = this.manager.os.kernel.console.body!;
    screen.addEventListener("dragenter", (ev) => {
      this.canvas.classList.add("active");
      screen.classList.add("drag");
    });
    screen.addEventListener("dragleave", (ev) => {
      this.canvas.classList.remove("active");
      screen.classList.remove("drag");
    });
    screen.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      ev.dataTransfer!.dropEffect = "copy";
    });
    screen.addEventListener("drop", (ev) => {
      ev.preventDefault();
      this.canvas.classList.remove("active");
      screen.classList.remove("drag");
      this.manager.install([...(ev.dataTransfer!.files as any)]);
    });
  }

  render() {
    return UI.fragment([
      UI.h("div", { class: "kate-hud-drop-installer-icon" }, [UI.fa_icon("download", "3x")]),
      UI.h("div", { class: "kate-hud-drop-installer-description" }, [
        "Drop ",
        UI.h("tt", {}, [".kart"]),
        " files here to install them",
      ]),
    ]);
  }
}
