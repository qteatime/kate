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

import { KateAudioManager } from "./audio";
import { ConsoleCaseConfig, KateConsoleCase } from "./case";
import { KateConsoleClock } from "./clock";
import { KateButtonInputAggregator } from "./input/button-input";
import { KateResources } from "./resource";
const pkg = require("../../package.json");
const build = require("../../../../kate-buildinfo.json").build;

export type ConsoleOptions = {
  mode: "native" | "web" | "single";
  persistent_storage: boolean;
  case: ConsoleCaseConfig;
};

export class VirtualConsole {
  readonly button_input = new KateButtonInputAggregator();
  readonly clock = new KateConsoleClock();
  readonly audio = new KateAudioManager();
  readonly case: KateConsoleCase;
  readonly resources: KateResources;

  private is_listening = false;

  readonly body: HTMLElement;
  readonly device_display: HTMLElement;
  readonly hud: HTMLElement;
  readonly os_root: HTMLElement;
  readonly version_container: HTMLElement | null = null;
  readonly version = pkg?.version == null ? null : `v${pkg.version}${build ? "-" + build : ""}`;

  constructor(readonly root: HTMLElement, readonly options: ConsoleOptions) {
    this.case = new KateConsoleCase(options.case);
    this.resources = new KateResources(root.querySelector("#kate-resources")!);

    this.os_root = root.querySelector("#kate-os-root")!;
    this.hud = root.querySelector("#kate-hud")!;
    this.device_display = root.querySelector(".kc-screen")!;
    this.body = root.querySelector(".kc-body")!;
    this.version_container = root.querySelector("#kate-version");

    if (
      this.os_root == null ||
      this.hud == null ||
      this.device_display == null ||
      this.body == null
    ) {
      throw new Error(`[kate:kernel] invalid HTML tree`);
    }
  }

  private do_tick(time: number) {
    this.button_input.update(time);
    this.button_input.tick();
  }

  get active() {
    return this.options.mode === "native" || (navigator.userActivation?.isActive ?? true);
  }

  get sticky_active() {
    return this.options.mode === "native" || (navigator.userActivation?.hasBeenActive ?? true);
  }

  vibrate(pattern: number | number[]) {
    if (navigator.vibrate != null && this.sticky_active) {
      navigator.vibrate(pattern);
    }
  }

  listen() {
    if (this.is_listening) {
      throw new Error(`[kate:virtual] listen called twice`);
    }
    this.is_listening = true;

    this.case.setup(this.root);

    this.button_input.setup(this.root);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.button_input.reset();
      }
    });

    this.clock.setup();
    this.clock.on_tick.listen((time) => this.do_tick(time));

    this.audio.open();

    if (this.version_container != null && this.version != null) {
      this.version_container.textContent = this.version;
    }
    console.debug(`[kate:virtual] Initialised virtual console`);
  }
}
