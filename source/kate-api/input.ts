import { EventStream } from "../util/events";
import { KateIPC } from "./channel";

export type InputKey =
  "up"
| "right"
| "down"
| "left"
| "menu"
| "capture"
| "x"
| "o"
| "ltrigger"
| "rtrigger";

export class KateInput {
  #channel: KateIPC;
  private _state: Record<InputKey, boolean> = Object.assign(Object.create(null), {
    up: false,
    right: false,
    down: false,
    left: false,
    menu: false,
    capture: false,
    x: false,
    o: false,
    ltrigger: false,
    rtrigger: false
  });

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  setup() {
    this.#channel.events.input_state_changed.listen(({ key, is_down }) => {
      this._state[key] = is_down;
    })
  }

  is_down(key: InputKey) {
    return this._state[key];
  }
}