import { EventStream } from "../../../util/build/events";
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

export type Resource = "screen-recording";

export type ConsoleOptions = {
  mode: "native" | "web" | "single";
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
  private _scale: number = 1;
  readonly body: HTMLElement;
  readonly device_display: HTMLElement;
  readonly screen: HTMLElement;
  readonly hud: HTMLElement;
  readonly os_root: HTMLElement;
  readonly version_container: HTMLElement | null;
  readonly resources_container: HTMLElement;
  readonly version = pkg?.version == null ? null : `v${pkg.version}`;
  readonly on_input_changed = new EventStream<{
    key: InputKey;
    is_down: boolean;
  }>();
  readonly on_key_pressed = new EventStream<ExtendedInputKey>();
  readonly on_tick = new EventStream<number>();
  readonly on_scale_changed = new EventStream<number>();
  readonly audio_context = new AudioContext();
  readonly resources = new Map<Resource, number>();

  private timer_id: any = null;
  private last_time: number | null = null;

  readonly SPECIAL_FRAMES = 15;
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

  constructor(root: HTMLElement, readonly options: ConsoleOptions) {
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
    this.screen = root.querySelector("#kate-game")!;
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

  get scale() {
    return this._scale;
  }

  listen() {
    if (this.is_listening) {
      throw new Error(`listen called twice`);
    }
    this.is_listening = true;

    window.addEventListener("load", () => this.update_scale(true));
    window.addEventListener("resize", () => this.update_scale(true));
    window.addEventListener("orientationchange", () => this.update_scale(true));
    (screen as any).addEventListener?.("orientationchange", () =>
      this.update_scale(true)
    );
    this.update_scale(true);

    this.body
      .querySelector(".kate-engraving")
      ?.addEventListener("click", () => {
        this.request_fullscreen();
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
      button.addEventListener("touchstart", (ev) => {
        ev.preventDefault();
        this.update_virtual_key(key, true);
      });
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

    this.start_ticking();
    this.on_tick.listen(this.key_update_loop);
  }

  private update_scale(force: boolean) {
    const width = 1312;
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    let zoom = Math.min(1, ww / width);
    if (zoom === this._scale && !force) {
      return;
    }

    const x = Math.round(ww - this.body.offsetWidth * zoom) / 2;
    const y = Math.round(wh - this.body.offsetHeight * zoom) / 2;

    this.body.style.transform = `scale(${zoom})`;
    this.body.style.transformOrigin = `0 0`;
    this.body.style.left = `${x}px`;
    this.body.style.top = `${y}px`;
    window.scrollTo({ left: 0, top: 0 });
    document.body.scroll({ left: 0, top: 0 });

    this._scale = zoom;
    this.on_scale_changed.emit(zoom);
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

  private update_single_key(key: InputKey, special: boolean) {
    const x = this.input_state[key];
    if (x.pressed) {
      x.count = (x.count + 1) >>> 0 || 2;
      if (special && x.count >= this.SPECIAL_FRAMES) {
        x.count = 0;
        x.pressed = false;
        this.on_key_pressed.emit(`long_${key as SpecialInputKey}`);
        this.render_button_state(key, false);
      } else if (!special && x.count === 1) {
        this.on_input_changed.emit({ key, is_down: true });
      }
    } else {
      if (special) {
        if (x.count === -1) {
          this.on_input_changed.emit({ key, is_down: false });
          this.on_key_pressed.emit(key);
          x.count = 0;
        } else if (x.count > 0 && x.count < this.SPECIAL_FRAMES) {
          this.on_input_changed.emit({ key, is_down: true });
          x.count = -1;
        }
      } else if (x.count > 0) {
        x.count = 0;
        this.on_input_changed.emit({ key, is_down: false });
        this.on_key_pressed.emit(key);
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
