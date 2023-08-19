import { EventStream, unreachable } from "../utils";
const pkg = require("../../package.json");

export type InputKey =
  | "up"
  | "right"
  | "down"
  | "left"
  | "menu"
  | "capture"
  | "x"
  | "o"
  | "ltrigger"
  | "rtrigger";

export type SpecialInputKey = "menu" | "capture";

export type ExtendedInputKey = InputKey | `long_${SpecialInputKey}`;

export type Resource = "screen-recording" | "transient-storage" | "low-storage";

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
  private up_button: HTMLElement;
  private right_button: HTMLElement;
  private down_button: HTMLElement;
  private left_button: HTMLElement;
  private menu_button: HTMLElement;
  private capture_button: HTMLElement;
  private x_button: HTMLElement;
  private o_button: HTMLElement;
  private ltrigger_button: HTMLElement;
  private rtrigger_button: HTMLElement;
  private is_listening = false;
  private _case: ConsoleCase;
  readonly body: HTMLElement;
  readonly device_display: HTMLElement;
  readonly hud: HTMLElement;
  readonly os_root: HTMLElement;
  readonly version_container: HTMLElement | null;
  readonly resources_container: HTMLElement;
  readonly version = pkg?.version == null ? null : `v${pkg.version}`;
  readonly on_input_changed = new EventStream<{
    key: InputKey;
    is_down: boolean;
  }>();
  readonly on_key_pressed = new EventStream<{
    key: ExtendedInputKey;
    is_repeat: boolean;
  }>();
  readonly on_virtual_button_touched = new EventStream<InputKey>();
  readonly on_tick = new EventStream<number>();
  readonly audio_context = new AudioContext();
  readonly resources = new Map<Resource, number>();

  private timer_id: any = null;
  private last_time: number | null = null;

  readonly SPECIAL_FRAMES = 15;
  readonly REPEAT_FRAMES = 10;
  readonly FPS = 30;
  readonly ONE_FRAME = Math.ceil(1000 / 30);

  private input_state!: Record<InputKey, { pressed: boolean; count: number }>;
  private keys: InputKey[] = [
    "up",
    "right",
    "down",
    "left",
    "x",
    "o",
    "ltrigger",
    "rtrigger",
  ];
  private special_keys: InputKey[] = ["menu", "capture"];

  constructor(readonly root: HTMLElement, readonly options: ConsoleOptions) {
    this._case = options.case;

    this.up_button = root.querySelector(".kate-dpad-up")!;
    this.right_button = root.querySelector(".kate-dpad-right")!;
    this.down_button = root.querySelector(".kate-dpad-down")!;
    this.left_button = root.querySelector(".kate-dpad-left")!;
    this.menu_button = root.querySelector(".kate-area-menu")!;
    this.capture_button = root.querySelector(".kate-area-capture")!;
    this.x_button = root.querySelector(".kate-button-x")!;
    this.o_button = root.querySelector(".kate-button-o")!;
    this.ltrigger_button = root.querySelector(".kate-trigger-left")!;
    this.rtrigger_button = root.querySelector(".kate-trigger-right")!;
    this.os_root = root.querySelector("#kate-os-root")!;
    this.hud = root.querySelector("#kate-hud")!;
    this.device_display = root.querySelector(".kate-screen")!;
    this.body = root.querySelector(".kate-body")!;
    this.version_container = root.querySelector(".kate-version");
    this.resources_container = root.querySelector(".kate-resources")!;
    if (this.version_container != null && this.version != null) {
      this.version_container.textContent = this.version;
    }
    this.open_audio_output();
    this.reset_states();
  }

  private reset_states() {
    this.input_state = {
      up: { pressed: false, count: 0 },
      right: { pressed: false, count: 0 },
      down: { pressed: false, count: 0 },
      left: { pressed: false, count: 0 },
      menu: { pressed: false, count: 0 },
      capture: { pressed: false, count: 0 },
      x: { pressed: false, count: 0 },
      o: { pressed: false, count: 0 },
      ltrigger: { pressed: false, count: 0 },
      rtrigger: { pressed: false, count: 0 },
    };
    this.up_button.classList.remove("down");
    this.right_button.classList.remove("down");
    this.down_button.classList.remove("down");
    this.left_button.classList.remove("down");
    this.menu_button.classList.remove("down");
    this.capture_button.classList.remove("down");
    this.x_button.classList.remove("down");
    this.o_button.classList.remove("down");
    this.ltrigger_button.classList.remove("down");
    this.rtrigger_button.classList.remove("down");
  }

  private start_ticking() {
    cancelAnimationFrame(this.timer_id);
    this.timer_id = requestAnimationFrame(this.tick);
  }

  private open_audio_output() {
    this.audio_context.resume().catch((e) => {});
    if (this.audio_context.state !== "running") {
      const open_audio_output = () => {
        this.audio_context.resume().catch((e) => {});
        window.removeEventListener("touchstart", open_audio_output);
        window.removeEventListener("click", open_audio_output);
        window.removeEventListener("keydown", open_audio_output);
      };
      window.addEventListener("touchstart", open_audio_output);
      window.addEventListener("click", open_audio_output);
      window.addEventListener("keydown", open_audio_output);
    }
  }

  private tick = (time: number) => {
    if (this.last_time == null) {
      this.last_time = time;
      this.on_tick.emit(time);
      this.timer_id = requestAnimationFrame(this.tick);
      return;
    }

    const elapsed = time - this.last_time;

    if (elapsed < this.ONE_FRAME) {
      this.timer_id = requestAnimationFrame(this.tick);
    } else {
      this.last_time = time;
      this.on_tick.emit(time);
      this.timer_id = requestAnimationFrame(this.tick);
    }
  };

  get case() {
    return Case.from_configuration(this._case);
  }

  get raw_case() {
    return this._case;
  }

  get active() {
    return (
      this.options.mode === "native" ||
      (navigator.userActivation?.isActive ?? true)
    );
  }

  get sticky_active() {
    return (
      this.options.mode === "native" ||
      (navigator.userActivation?.hasBeenActive ?? true)
    );
  }

  vibrate(pattern: number | number[]) {
    if (navigator.vibrate != null && this.sticky_active) {
      navigator.vibrate(pattern);
    }
  }

  listen() {
    if (this.is_listening) {
      throw new Error(`listen called twice`);
    }
    this.is_listening = true;

    window.addEventListener("load", () => this.update_scale(null));
    window.addEventListener("resize", () => this.update_scale(null));
    window.addEventListener("orientationchange", () => this.update_scale(null));
    (screen as any).addEventListener?.("orientationchange", () =>
      this.update_scale(null)
    );
    this.update_scale(null);

    this.body
      .querySelector(".kate-engraving")
      ?.addEventListener("click", () => {
        this.set_case(
          this._case.type === "handheld"
            ? {
                type: "tv",
                resolution: 720,
                scale_to_fit: this._case.scale_to_fit,
              }
            : {
                type: "handheld",
                resolution: 480,
                scale_to_fit: this._case.scale_to_fit,
              }
        );
      });

    const listen_button = (button: HTMLElement, key: InputKey) => {
      button.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        this.update_virtual_key(key, true);
      });
      button.addEventListener("mouseup", (ev) => {
        ev.preventDefault();
        this.update_virtual_key(key, false);
      });
      button.addEventListener(
        "touchstart",
        (ev) => {
          ev.preventDefault();
          this.on_virtual_button_touched.emit(key);
          this.update_virtual_key(key, true);
        },
        { passive: false }
      );
      button.addEventListener("touchend", (ev) => {
        ev.preventDefault();
        this.update_virtual_key(key, false);
      });
    };

    listen_button(this.up_button, "up");
    listen_button(this.right_button, "right");
    listen_button(this.down_button, "down");
    listen_button(this.left_button, "left");
    listen_button(this.menu_button, "menu");
    listen_button(this.capture_button, "capture");
    listen_button(this.x_button, "x");
    listen_button(this.o_button, "o");
    listen_button(this.ltrigger_button, "ltrigger");
    listen_button(this.rtrigger_button, "rtrigger");

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.reset_all_keys();
      }
    });

    this.start_ticking();
    this.on_tick.listen(this.key_update_loop);
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
      await screen.orientation.lock("landscape").catch((_) => {});
      return true;
    } catch (error) {
      console.warn(
        `[Kate] locking orientation in fullscreen not supported`,
        error
      );
      return false;
    }
  }

  private key_update_loop = (time: number) => {
    for (const key of this.keys) {
      this.update_single_key(key, false);
    }
    for (const key of this.special_keys) {
      this.update_single_key(key, true);
    }
  };

  reset_all_keys() {
    for (const key of this.keys) {
      this.update_virtual_key(key, false);
    }
  }

  private update_single_key(key: InputKey, special: boolean) {
    const x = this.input_state[key];
    if (x.pressed) {
      x.count = (x.count + 1) >>> 0 || 2;
      if (special && x.count >= this.SPECIAL_FRAMES) {
        x.count = 0;
        x.pressed = false;
        this.on_key_pressed.emit({
          key: `long_${key as SpecialInputKey}`,
          is_repeat: false,
        });
        this.render_button_state(key, false);
      } else if (!special && x.count === 1) {
        this.on_input_changed.emit({ key, is_down: true });
        this.on_key_pressed.emit({ key, is_repeat: false });
      } else if (!special && x.count % this.REPEAT_FRAMES === 0) {
        this.on_key_pressed.emit({ key, is_repeat: true });
      }
    } else {
      if (special) {
        if (x.count === -1) {
          this.on_input_changed.emit({ key, is_down: false });
          x.count = 0;
        } else if (x.count > 0 && x.count < this.SPECIAL_FRAMES) {
          this.on_input_changed.emit({ key, is_down: true });
          this.on_key_pressed.emit({ key, is_repeat: false });
          x.count = -1;
        }
      } else if (x.count > 0) {
        x.count = 0;
        this.on_input_changed.emit({ key, is_down: false });
      }
    }
  }

  update_virtual_key(key: InputKey, state: boolean) {
    const x = this.input_state[key];
    if (x.pressed !== state) {
      x.pressed = state;
      if (state) {
        x.count = 0;
      }
      this.render_button_state(key, state);
    }
  }

  private render_button_state(key: InputKey, state: boolean) {
    const button = {
      up: this.up_button,
      right: this.right_button,
      down: this.down_button,
      left: this.left_button,
      menu: this.menu_button,
      capture: this.capture_button,
      x: this.x_button,
      o: this.o_button,
      ltrigger: this.ltrigger_button,
      rtrigger: this.rtrigger_button,
    }[key];

    if (state) {
      button.classList.add("down");
    } else {
      button.classList.remove("down");
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
  readonly screen_bevel = 10;
  readonly case_padding = 25;
  readonly side_padding = 250;
  readonly depth_padding = 10;
  readonly shoulder_padding = 20;

  get screen_scale() {
    return Case.BASE_HEIGHT / this.resolution;
  }

  get padding() {
    return {
      horizontal: this.screen_bevel * 2 + this.side_padding * 2,
      vertical:
        this.screen_bevel * 2 +
        this.case_padding * 2 +
        this.depth_padding +
        this.shoulder_padding,
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
      vertical:
        this.screen_bevel * 2 + this.case_padding * 2 + this.depth_padding,
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
