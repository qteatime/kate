import type { VirtualConsole } from "./virtual";

export class GamepadInput {
  private attached = false;
  private gamepad: LayoutedGamepad | null = null;
  private layouts = [new StandardGamepad()];
  private timer_id: any = null;

  constructor(private console: VirtualConsole) {}

  setup() {
    if (this.attached) {
      throw new Error(`setup() called twice`);
    }
    this.attached = true;

    window.addEventListener("gamepadconnected", (ev) => {
      this.update_gamepad(ev.gamepad, true);
    });

    window.addEventListener("gamepaddisconnected", (ev) => {
      this.update_gamepad(ev.gamepad, false);
    });
  }

  pause(gamepad: Gamepad) {
    if (this.gamepad?.is_same(gamepad)) {
      this.gamepad.pause();
    }
  }

  unpause(gamepad: Gamepad) {
    if (this.gamepad?.is_same(gamepad)) {
      this.gamepad.unpause();
    }
  }

  update_gamepad(gamepad: Gamepad, connected: boolean) {
    if (this.gamepad == null && connected) {
      this.gamepad = this.get_layout(gamepad);
    } else if (this.gamepad?.is_same(gamepad) && !connected) {
      this.gamepad = null;
    }

    if (this.gamepad != null) {
      cancelAnimationFrame(this.timer_id);
      this.timer_id = requestAnimationFrame(this.update_virtual_state);
    }
  }

  get_layout(gamepad: Gamepad): LayoutedGamepad | null {
    const layout = this.layouts.find((x) => x.accepts(gamepad));
    if (layout != null) {
      return new LayoutedGamepad(gamepad, layout, this.console);
    } else {
      return null;
    }
  }

  update_virtual_state = (time: number) => {
    this.gamepad?.update_virtual_state(time);
    this.timer_id = requestAnimationFrame(this.update_virtual_state);
  };
}

class LayoutedGamepad {
  private last_update: number | null = null;
  private _paused: boolean = false;
  constructor(
    readonly raw_gamepad: Gamepad,
    readonly layout: GamepadLayout,
    readonly console: VirtualConsole
  ) {}

  is_same(gamepad: Gamepad) {
    return this.raw_gamepad.id === gamepad.id;
  }

  pause() {
    this._paused = true;
  }

  unpause() {
    this._paused = false;
  }

  private resolve_gamepad() {
    const gamepad = navigator.getGamepads()[this.raw_gamepad.index] ?? null;
    if (gamepad?.id !== this.raw_gamepad.id) {
      return null;
    } else {
      return gamepad;
    }
  }

  update_virtual_state(time: number) {
    if (this._paused) {
      return;
    }

    const g = this.resolve_gamepad();
    if (g == null) {
      return;
    }
    if (this.last_update != null && this.last_update > g.timestamp) {
      return;
    }

    this.last_update = time;
    this.layout.update(this.console, g);
  }
}

const enum Std {
  UP = 12,
  RIGHT = 15,
  DOWN = 13,
  LEFT = 14,
  MENU = 9,
  CAPTURE = 8,
  X = 0,
  O = 1,
  L = 4,
  R = 5,
}

interface GamepadLayout {
  accepts(gamepad: Gamepad): boolean;
  update(console: VirtualConsole, gamepad: Gamepad): void;
}

class StandardGamepad implements GamepadLayout {
  accepts(gamepad: Gamepad) {
    return gamepad.mapping === "standard";
  }

  update(console: VirtualConsole, g: Gamepad) {
    console.update_virtual_key(
      "up",
      g.buttons[Std.UP].pressed || g.axes[1] < -0.5
    );
    console.update_virtual_key(
      "right",
      g.buttons[Std.RIGHT].pressed || g.axes[0] > 0.5
    );
    console.update_virtual_key(
      "down",
      g.buttons[Std.DOWN].pressed || g.axes[1] > 0.5
    );
    console.update_virtual_key(
      "left",
      g.buttons[Std.LEFT].pressed || g.axes[0] < -0.5
    );
    console.update_virtual_key("x", g.buttons[Std.X].pressed);
    console.update_virtual_key("o", g.buttons[Std.O].pressed);
    console.update_virtual_key("ltrigger", g.buttons[Std.L].pressed);
    console.update_virtual_key("rtrigger", g.buttons[Std.R].pressed);
    console.update_virtual_key("menu", g.buttons[Std.MENU].pressed);
    console.update_virtual_key("capture", g.buttons[Std.CAPTURE].pressed);
  }
}
