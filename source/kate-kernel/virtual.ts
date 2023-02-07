import { EventStream } from "../util/events";

export type InputKey =
  "up"
| "right"
| "down"
| "left"
| "menu"
| "capture"
| "a"
| "b"
| "ltrigger"
| "rtrigger";

export type SpecialInputKey =
  "menu" | "capture";

export type ExtendedInputKey =
  InputKey | `long_${SpecialInputKey}`;

export class VirtualConsole {
  private up_button: HTMLElement;
  private right_button: HTMLElement;
  private down_button: HTMLElement;
  private left_button: HTMLElement;
  private menu_button: HTMLElement;
  private capture_button: HTMLElement;
  private a_button: HTMLElement;
  private b_button: HTMLElement;
  private ltrigger_button: HTMLElement;
  private rtrigger_button: HTMLElement;
  private is_listening = false;
  readonly body: HTMLElement;
  readonly screen: HTMLElement;
  readonly hud: HTMLElement;
  readonly os_root: HTMLElement;
  readonly on_input_changed = new EventStream<{key: InputKey, is_down: boolean}>();
  readonly on_key_pressed = new EventStream<ExtendedInputKey>();

  readonly LONG_PRESS_TIME_MS = 500;
  readonly FPS = 30;
  readonly ONE_FRAME = Math.ceil(1000 / 30);

  private input_state!: Record<InputKey, boolean>;
  private special_input_timing!: Record<SpecialInputKey, any>;

  constructor(root: HTMLElement) {
    this.up_button = root.querySelector(".kate-dpad-up")!;
    this.right_button = root.querySelector(".kate-dpad-right")!;
    this.down_button = root.querySelector(".kate-dpad-down")!;
    this.left_button = root.querySelector(".kate-dpad-left")!;
    this.menu_button = root.querySelector(".kate-button-menu")!;
    this.capture_button = root.querySelector(".kate-button-capture")!;
    this.a_button = root.querySelector(".kate-button-a")!;
    this.b_button = root.querySelector(".kate-button-b")!;
    this.ltrigger_button = root.querySelector(".kate-trigger-left")!;
    this.rtrigger_button = root.querySelector(".kate-trigger-right")!;
    this.screen = root.querySelector("#kate-game")!;
    this.os_root = root.querySelector("#kate-os-root")!;
    this.hud = root.querySelector("#kate-hud")!;
    this.body = root.querySelector(".kate-body")!;
    this.reset_states();
  }

  private reset_states() {
    this.input_state = {
      up: false,
      right: false,
      down: false,
      left: false,
      menu: false,
      capture: false,
      a: false,
      b: false,
      ltrigger: false,
      rtrigger: false
    };
    this.special_input_timing = {
      menu: null,
      capture: null,
    };
    this.up_button.classList.remove("down");
    this.right_button.classList.remove("down");
    this.down_button.classList.remove("down");
    this.left_button.classList.remove("down");
    this.menu_button.classList.remove("down");
    this.capture_button.classList.remove("down");
    this.a_button.classList.remove("down");
    this.b_button.classList.remove("down");
    this.ltrigger_button.classList.remove("down")
    this.rtrigger_button.classList.remove("down")
  }

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
      })
      button.addEventListener("touchstart", (ev) => {
        ev.preventDefault();
        this.update_virtual_key(key, true);
      });
      button.addEventListener("touchend", (ev) => {
        ev.preventDefault();
        this.update_virtual_key(key, false);
      })
    }

    listen_button(this.up_button, "up");
    listen_button(this.right_button, "right");
    listen_button(this.down_button, "down");
    listen_button(this.left_button, "left");
    listen_button(this.menu_button, "menu");
    listen_button(this.capture_button, "capture");
    listen_button(this.a_button, "a");
    listen_button(this.b_button, "b");
  }

  private is_special_key(key: InputKey): key is SpecialInputKey {
    return this.special_input_timing.hasOwnProperty(key);
  }

  // Made a bit complicated because we want to avoid forwarding special keys
  // to game processes before we know if this is a regular press of the key
  // or a long press of the key. In that sense, all special keys have a 1/30
  // frame delay inserted.
  update_virtual_key(key: InputKey, state: boolean) {
    if (this.input_state[key] !== state) {
      this.input_state[key] = state;
      this.render_button_state(key, state);

      if (this.is_special_key(key)) {
        clearTimeout(this.special_input_timing[key]);
        if (state === false) {
          this.on_input_changed.emit({ key, is_down: true });
          setTimeout(() => {
            if (this.input_state[key] === false) {
              this.on_input_changed.emit({ key, is_down: false });
            }
          }, this.ONE_FRAME);
        } else {
          this.special_input_timing[key] = setTimeout(() => {
            if (this.input_state[key] === true) {
              this.input_state[key] = false;
              this.render_button_state(key, false);
              this.on_key_pressed.emit(`long_${key}`);
            }
          }, this.LONG_PRESS_TIME_MS);
        }
      } else {
        this.on_input_changed.emit({ key, is_down: state });
      }

      if (state === false) {
        this.on_key_pressed.emit(key);
      }
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
      a: this.a_button,
      b: this.b_button,
      ltrigger: this.ltrigger_button,
      rtrigger: this.rtrigger_button
    }[key];

    if (state) {
      button.classList.add("down");
    } else {
      button.classList.remove("down");
    }
  }
}