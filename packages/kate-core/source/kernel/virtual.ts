import { EventStream } from "../../../util/build/events";

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
  readonly body: HTMLElement;
  readonly device_display: HTMLElement;
  readonly screen: HTMLElement;
  readonly hud: HTMLElement;
  readonly os_root: HTMLElement;
  readonly on_input_changed = new EventStream<{
    key: InputKey;
    is_down: boolean;
  }>();
  readonly on_key_pressed = new EventStream<ExtendedInputKey>();
  readonly on_tick = new EventStream<number>();

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

  constructor(root: HTMLElement) {
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

  listen() {
    if (this.is_listening) {
      throw new Error(`listen called twice`);
    }
    this.is_listening = true;

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

    this.start_ticking();
    this.on_tick.listen(this.key_update_loop);
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
}
