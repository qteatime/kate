import { EventStream } from "../../util/build/events";
import type { KateIPC } from "./channel";

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

export type ExtendedInputKey = InputKey | "long_menu" | "long_capture";

export class KateInput {
  #channel: KateIPC;
  readonly on_key_pressed = new EventStream<ExtendedInputKey>();
  private _paused = false;
  private _state: Record<InputKey, boolean> = Object.assign(
    Object.create(null),
    {
      up: false,
      right: false,
      down: false,
      left: false,
      menu: false,
      capture: false,
      x: false,
      o: false,
      ltrigger: false,
      rtrigger: false,
    }
  );

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  get is_paused() {
    return this._paused;
  }

  setup() {
    this.#channel.events.input_state_changed.listen(({ key, is_down }) => {
      if (!this._paused) {
        this._state[key] = is_down;
      }
    });
    this.#channel.events.key_pressed.listen((key) => {
      if (!this._paused) {
        this.on_key_pressed.emit(key);
      }
    });
    this.#channel.events.paused.listen((state) => {
      this._paused = state;
      for (const key of Object.keys(this._state)) {
        this._state[key as InputKey] = false;
      }
    });
  }

  is_down(key: InputKey) {
    return this._state[key];
  }
}
