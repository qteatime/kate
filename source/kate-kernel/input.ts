import { InputKey, VirtualConsole } from "./virtual";

export class KeyboardInput {
  private physical_config: Record<InputKey, string> = {
    up: "ArrowUp",
    right: "ArrowRight",
    down: "ArrowDown",
    left: "ArrowLeft",
    menu: "ShiftLeft",
    capture: "ControlLeft",
    x: "KeyX",
    o: "KeyZ",
    ltrigger: "KeyA",
    rtrigger: "KeyS",
  };

  private ignore_repeat = ["menu", "capture"];

  private physical_map!: { [key: string]: InputKey };
  private attached = false;

  constructor(private console: VirtualConsole) {
    this.update_physical_map();
  }

  private update_physical_map() {
    const map: { [key: string]: InputKey } = Object.create(null);
    for (const [key, value] of Object.entries(this.physical_config)) {
      map[value] = key as InputKey;
    }
    this.physical_map = map;
  }

  listen(root: HTMLElement) {
    if (this.attached) {
      throw new Error(`listen called twice`);
    }
    this.attached = true;

    document.addEventListener("keydown", (ev) => {
      if (ev.code in this.physical_map) {
        ev.preventDefault();
        const key = this.physical_map[ev.code];
        if (!this.ignore_repeat.includes(key) || !ev.repeat) {
          this.console.update_virtual_key(key, true);
        }
      }
    });

    document.addEventListener("keyup", (ev) => {
      if (ev.code in this.physical_map) {
        ev.preventDefault();
        this.console.update_virtual_key(this.physical_map[ev.code], false);
      }
    });
  }
}
