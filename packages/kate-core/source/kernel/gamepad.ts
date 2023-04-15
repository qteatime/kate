import type { InputKey, VirtualConsole } from "./virtual";

export type GamepadButtonToKate = {
  type: "button";
  index: number;
  pressed: InputKey;
};

export type GamepadAxisToKate = {
  type: "axis";
  index: number;
  negative: InputKey | null;
  positive: InputKey | null;
};

export type GamepadMapping = GamepadButtonToKate | GamepadAxisToKate;

export class GamepadInput {
  private attached = false;
  private _paired: string | null = null;
  private gamepad: GamepadAdaptor | null = null;
  private mapping: GamepadMapping[] = [];
  private timer_id: any = null;

  constructor(private console: VirtualConsole) {}

  setup() {
    if (this.attached) {
      throw new Error(`setup() called twice`);
    }
    this.attached = true;

    window.addEventListener("gamepadconnected", (ev) => {
      this.select_gamepad();
    });

    window.addEventListener("gamepaddisconnected", (ev) => {
      this.select_gamepad();
    });
  }

  get current() {
    return this.gamepad;
  }

  pair(id: string | null) {
    this._paired = id;
    this.select_gamepad();
  }

  unpair() {
    this._paired = null;
    this.select_gamepad();
  }

  private find_active_gamepad() {
    const gamepads = navigator.getGamepads();
    return gamepads
      .flatMap((x) => (x == null || !x.connected ? [] : [x]))
      .sort((a, b) => b.timestamp - a.timestamp)
      .find((_) => true);
  }

  pause() {
    this.gamepad?.pause();
  }

  unpause() {
    this.gamepad?.unpause();
  }

  remap(mapping: GamepadMapping[]) {
    this.mapping = mapping;
    if (this.gamepad != null) {
      this.gamepad.remap(mapping);
    }
  }

  use_gamepad(gamepad: Gamepad | null) {
    if (gamepad != null && gamepad.mapping === "standard") {
      this.gamepad = new GamepadAdaptor(gamepad, this.mapping, this.console);
      this.schedule_update();
    } else {
      this.gamepad = null;
    }
  }

  select_gamepad() {
    const gamepads = navigator.getGamepads();
    if (this._paired != null) {
      const gamepad = gamepads.find((x) => x?.id === this._paired) ?? null;
      this.use_gamepad(gamepad);
    } else {
      const gamepad = this.find_active_gamepad() ?? null;
      this.use_gamepad(gamepad);
    }
  }

  schedule_update() {
    if (this.gamepad != null) {
      cancelAnimationFrame(this.timer_id);
      this.timer_id = requestAnimationFrame(this.update_virtual_state);
    }
  }

  update_virtual_state = (time: number) => {
    this.gamepad?.update_virtual_state(time);
    this.schedule_update();
  };
}

class GamepadAdaptor {
  private _last_update: number | null = null;
  private _paused: boolean = false;
  constructor(
    private _raw_static: Gamepad,
    private mapping: GamepadMapping[],
    readonly console: VirtualConsole
  ) {}

  is_same(gamepad: Gamepad) {
    return this._raw_static.id === gamepad.id;
  }

  get raw() {
    const gamepads = navigator.getGamepads();
    return gamepads.find((x) => x?.id === this._raw_static.id) ?? null;
  }

  remap(mapping: GamepadMapping[]) {
    this.mapping = mapping;
  }

  pause() {
    this._paused = true;
  }

  unpause() {
    this._paused = false;
  }

  private resolve_gamepad() {
    return (
      navigator.getGamepads().find((x) => x?.id === this._raw_static.id) ?? null
    );
  }

  update_virtual_state(time: number) {
    if (this._paused) {
      return;
    }

    const g = this.resolve_gamepad();
    if (g == null) {
      return;
    }
    if (this._last_update != null && this._last_update > g.timestamp) {
      return;
    }

    this._last_update = time;
    const changes = new Map<InputKey, boolean>();
    const update_state = (key: InputKey | null, value: boolean) => {
      if (key != null) {
        changes.set(key, changes.get(key) || value);
      }
    };

    for (const mapping of this.mapping) {
      switch (mapping.type) {
        case "button": {
          update_state(mapping.pressed, g.buttons[mapping.index].pressed);
          break;
        }

        case "axis": {
          const axis = g.axes[mapping.index];
          if (axis < -0.5) {
            update_state(mapping.negative, true);
            update_state(mapping.positive, false);
          } else if (axis > 0.5) {
            update_state(mapping.negative, false);
            update_state(mapping.positive, true);
          } else {
            update_state(mapping.negative, false);
            update_state(mapping.positive, false);
          }
          break;
        }
      }
    }
    for (const [key, change] of changes) {
      this.console.update_virtual_key(key, change);
    }
  }
}
