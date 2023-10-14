/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { unreachable } from "../utils";
import { KateAudioManager } from "./audio";
import { ConsoleCaseConfig, KateConsoleCase } from "./case";
import { KateConsoleClock } from "./clock";
import { KateButtonInputAggregator } from "./input/button-input";
const pkg = require("../../package.json");

export type Resource = "screen-recording" | "transient-storage" | "low-storage" | "trusted-mode";

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

  private is_listening = false;

  readonly body: HTMLElement;
  readonly device_display: HTMLElement;
  readonly hud: HTMLElement;
  readonly os_root: HTMLElement;
  readonly version_container: HTMLElement | null;
  readonly resources_container: HTMLElement;
  readonly version = pkg?.version == null ? null : `v${pkg.version}`;
  readonly resources = new Map<Resource, number>();

  constructor(readonly root: HTMLElement, readonly options: ConsoleOptions) {
    this.case = new KateConsoleCase(options.case);

    this.os_root = root.querySelector("#kate-os-root")!;
    this.hud = root.querySelector("#kate-hud")!;
    this.device_display = root.querySelector(".kate-screen")!;
    this.body = root.querySelector(".kc-body")!;
    this.version_container = root.querySelector("#kate-version");
    this.resources_container = root.querySelector("#kate-resources")!;
    if (this.version_container != null && this.version != null) {
      this.version_container.textContent = this.version;
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
  }

  take_resource(resource: Resource) {
    const refs = this.resources.get(resource) ?? 0;
    this.resources.set(resource, refs + 1);
    this.update_resource_display();
  }

  is_resource_taken(resource: Resource) {
    return (this.resources.get(resource) ?? 0) > 0;
  }

  release_resource(resource: Resource) {
    const refs = this.resources.get(resource) ?? 0;
    this.resources.set(resource, Math.max(0, refs - 1));
    this.update_resource_display();
  }

  private update_resource_display() {
    this.resources_container.textContent = "";
    for (const [resource, refs] of this.resources.entries()) {
      if (refs > 0) {
        const e = document.createElement("div");
        e.className = `kate-resource kate-resource-${resource}`;
        this.resources_container.append(e);
      }
    }
  }
}
