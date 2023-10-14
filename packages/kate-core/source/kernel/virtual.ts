/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { unreachable } from "../utils";
import { KateAudioManager } from "./audio";
import { KateConsoleClock } from "./clock";
import { KateButtonInputAggregator } from "./input/button-input";
const pkg = require("../../package.json");

export type Resource = "screen-recording" | "transient-storage" | "low-storage" | "trusted-mode";

export type ConsoleCase = {
  type: "handheld" | "tv" | "fullscreen";
  resolution: 480 | 720;
  scale_to_fit: boolean;
};

export type ConsoleOptions = {
  mode: "native" | "web" | "single";
  persistent_storage: boolean;
  case: ConsoleCase;
};

export class VirtualConsole {
  readonly button_input = new KateButtonInputAggregator();
  readonly clock = new KateConsoleClock();
  readonly audio = new KateAudioManager();

  private is_listening = false;
  private _case: ConsoleCase;
  readonly body: HTMLElement;
  readonly device_display: HTMLElement;
  readonly hud: HTMLElement;
  readonly os_root: HTMLElement;
  readonly version_container: HTMLElement | null;
  readonly resources_container: HTMLElement;
  readonly version = pkg?.version == null ? null : `v${pkg.version}`;
  readonly resources = new Map<Resource, number>();

  constructor(readonly root: HTMLElement, readonly options: ConsoleOptions) {
    this._case = options.case;

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

  get case() {
    return Case.from_configuration(this._case);
  }

  get raw_case() {
    return this._case;
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

    window.addEventListener("load", () => this.update_scale(null));
    window.addEventListener("resize", () => this.update_scale(null));
    window.addEventListener("orientationchange", () => this.update_scale(null));
    (screen as any).addEventListener?.("orientationchange", () => this.update_scale(null));
    this.update_scale(null);

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

  set_case(kase: ConsoleCase) {
    const old_case = this.case;
    this._case = kase;
    this.body.classList.toggle("scale-to-fit", kase.scale_to_fit);
    this.update_scale(old_case);
  }

  private update_scale(old_case: Case | null) {
    this.case.transition(old_case, this.root);
    window.scrollTo({ left: 0, top: 0 });
    document.body.scroll({ left: 0, top: 0 });
  }

  async request_fullscreen() {
    try {
      await document.body.requestFullscreen({ navigationUI: "hide" });
      await (screen.orientation as any).lock("landscape").catch((_: any) => {}); // FIXME:
      return true;
    } catch (error) {
      console.warn(`[Kate] locking orientation in fullscreen not supported`, error);
      return false;
    }
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

abstract class Case {
  static readonly BASE_HEIGHT = 480;
  static readonly BASE_WIDTH = 800;
  abstract case_type: ConsoleCase["type"];
  abstract padding: { horizontal: number; vertical: number };

  constructor(readonly resolution: ConsoleCase["resolution"]) {}

  get screen_scale() {
    return this.resolution / Case.BASE_HEIGHT;
  }

  get screen_width() {
    return Case.BASE_WIDTH * this.screen_scale;
  }

  get screen_height() {
    return Case.BASE_HEIGHT * this.screen_scale;
  }

  get width() {
    return this.screen_width + this.padding.horizontal;
  }

  get height() {
    return this.screen_height + this.padding.vertical;
  }

  static from_configuration(kase: ConsoleCase) {
    switch (kase.type) {
      case "handheld":
        return new HandheldCase(kase.resolution);

      case "tv":
        return new TvCase(kase.resolution);

      case "fullscreen":
        return new FullscreenCase(kase.resolution);

      default:
        throw unreachable(kase.type, "console case type");
    }
  }

  async transition(old: Case | null, root: HTMLElement) {
    if (old != null) {
      await old.exit();
      await this.enter();
    }
    this.resize(root);
  }

  resize(root: HTMLElement) {
    const width = this.width;
    const height = this.height;
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const scale = Math.min(ww / width, wh / height);
    const screen_scale = this.screen_height / Case.BASE_HEIGHT;

    root.setAttribute("data-case-type", this.case_type);
    root.setAttribute("data-resolution", String(this.screen_height));
    root.style.setProperty("--case-scale", String(scale));
    root.style.setProperty("--case-downscale", String(Math.min(1, scale)));
    root.style.setProperty("--screen-scale", String(screen_scale));
    root.style.setProperty("--screen-width", `${this.screen_width}px`);
    root.style.setProperty("--screen-height", `${this.screen_height}px`);

    if (KateNative != null) {
      KateNative.resize({ width, height });
    }
  }

  async enter() {}

  async exit() {}
}

class HandheldCase extends Case {
  readonly case_type = "handheld";

  get screen_scale() {
    return Case.BASE_HEIGHT / this.resolution;
  }

  get padding() {
    return {
      horizontal: 240,
      vertical: 10,
    };
  }
}

class TvCase extends Case {
  readonly case_type = "tv";
  readonly screen_bevel = 10;
  readonly case_padding = 32;
  readonly depth_padding = 10;

  get padding() {
    return {
      horizontal: this.screen_bevel * 2 + this.case_padding * 2,
      vertical: this.screen_bevel * 2 + this.case_padding * 2 + this.depth_padding,
    };
  }
}

class FullscreenCase extends Case {
  readonly case_type = "fullscreen";

  get padding() {
    return {
      horizontal: 0,
      vertical: 0,
    };
  }

  async enter() {
    if (KateNative == null && document.fullscreenEnabled) {
      await document.documentElement
        .requestFullscreen({
          navigationUI: "hide",
        })
        .catch(() => {});
    }
  }

  async exit() {
    if (KateNative == null && document.fullscreenElement != null) {
      await document.exitFullscreen().catch(() => {});
    }
  }
}
