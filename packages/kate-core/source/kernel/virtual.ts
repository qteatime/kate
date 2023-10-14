/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { KateAudioManager } from "./audio";
import { ConsoleCaseConfig, KateConsoleCase } from "./case";
import { KateConsoleClock } from "./clock";
import { KateButtonInputAggregator } from "./input/button-input";
import { KateResources } from "./resource";
const pkg = require("../../package.json");

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
  readonly resources = new KateResources();

  private is_listening = false;

  readonly body: HTMLElement | null = null;
  readonly device_display: HTMLElement | null = null;
  readonly hud: HTMLElement | null = null;
  readonly os_root: HTMLElement | null = null;
  readonly version_container: HTMLElement | null = null;
  readonly version = pkg?.version == null ? null : `v${pkg.version}`;

  constructor(readonly root: HTMLElement, readonly options: ConsoleOptions) {
    this.case = new KateConsoleCase(options.case);
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

    this.resources.setup(this.root.querySelector("#kate-resources")!);

    (this as any).os_root = this.root.querySelector("#kate-os-root")!;
    (this as any).hud = this.root.querySelector("#kate-hud")!;
    (this as any).device_display = this.root.querySelector(".kate-screen")!;
    (this as any).body = this.root.querySelector(".kc-body")!;
    (this as any).version_container = this.root.querySelector("#kate-version");

    if (this.version_container != null && this.version != null) {
      this.version_container.textContent = this.version;
    }
  }
}
