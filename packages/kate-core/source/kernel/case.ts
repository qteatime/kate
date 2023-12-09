/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { unreachable } from "../utils";

export type ConsoleCaseConfig = {
  type: "handheld" | "tv" | "fullscreen";
  resolution: 480 | 720;
  scale_to_fit: boolean;
};

export class KateConsoleCase {
  private _attached = false;
  private _root: HTMLElement | null = null;

  constructor(private _config: ConsoleCaseConfig) {}

  setup(root: HTMLElement) {
    if (this._attached) {
      throw new Error(`[kernel:case] setup() called twice`);
    }
    this._root = root;

    window.addEventListener("load", () => this.update_scale(null));
    window.addEventListener("resize", () => this.update_scale(null));
    window.addEventListener("orientationchange", () => this.update_scale(null));
    (screen as any).addEventListener?.("orientationchange", () => this.update_scale(null));
    this.update_scale(null);
    console.debug(`[kate:case] Initialised console case`);
  }

  get current() {
    return BaseConsoleCase.from_configuration(this._config);
  }

  get config() {
    return this._config;
  }

  reconfigure(config: ConsoleCaseConfig) {
    const old_case = this.current;
    this._config = config;
    this._root!.querySelector(".kc-body")!.classList.toggle("scale-to-fit", config.scale_to_fit);
    this.update_scale(old_case);
  }

  async request_fullscreen() {
    try {
      await document.body.requestFullscreen({ navigationUI: "hide" });
      await (screen.orientation as any).lock("landscape").catch((_: any) => {}); // FIXME:
      return true;
    } catch (error) {
      console.warn(`[kernel:case] locking orientation in fullscreen not supported`, error);
      return false;
    }
  }

  private update_scale(old_case: BaseConsoleCase | null) {
    console.debug(`[kate:case] Updating console case to `, this._config);
    this.current.transition(old_case, this._root!);
    window.scrollTo({ left: 0, top: 0 });
    document.body.scroll({ left: 0, top: 0 });
  }
}

abstract class BaseConsoleCase {
  static readonly BASE_HEIGHT = 480;
  static readonly BASE_WIDTH = 800;
  abstract case_type: ConsoleCaseConfig["type"];
  abstract padding: { horizontal: number; vertical: number };

  constructor(readonly resolution: ConsoleCaseConfig["resolution"]) {}

  get screen_scale() {
    return this.resolution / BaseConsoleCase.BASE_HEIGHT;
  }

  get screen_width() {
    return BaseConsoleCase.BASE_WIDTH * this.screen_scale;
  }

  get screen_height() {
    return BaseConsoleCase.BASE_HEIGHT * this.screen_scale;
  }

  get width() {
    return this.screen_width + this.padding.horizontal;
  }

  get height() {
    return this.screen_height + this.padding.vertical;
  }

  static from_configuration(kase: ConsoleCaseConfig) {
    switch (kase.type) {
      case "handheld":
        return new KateHandheldCase(kase.resolution);

      case "tv":
        return new KateTvCase(kase.resolution);

      case "fullscreen":
        return new KateFullscreenCase(kase.resolution);

      default:
        throw unreachable(kase.type, "console case type");
    }
  }

  async transition(old: BaseConsoleCase | null, root: HTMLElement) {
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
    const screen_scale = this.screen_height / BaseConsoleCase.BASE_HEIGHT;

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

class KateHandheldCase extends BaseConsoleCase {
  readonly case_type = "handheld";

  get screen_scale() {
    return BaseConsoleCase.BASE_HEIGHT / this.resolution;
  }

  get padding() {
    return {
      horizontal: 240,
      vertical: 10,
    };
  }
}

class KateTvCase extends BaseConsoleCase {
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

class KateFullscreenCase extends BaseConsoleCase {
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
