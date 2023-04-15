import { EventStream } from "../../utils";
import { ExtendedInputKey, InputKey } from "../../kernel/virtual";
import type { KateOS } from "../os";

export type InteractionHandler = {
  key: InputKey[];
  allow_repeat?: boolean;
  on_click?: boolean;
  on_menu?: boolean;
  label: string;
  handler: (key: InputKey, is_repeat: boolean) => void;
  enabled?: () => boolean;
};

export type FocusInteraction = {
  handlers: InteractionHandler[];
};

export class KateFocusHandler {
  private _stack: (HTMLElement | null)[] = [];
  private _current_root: HTMLElement | null = null;
  private _previous_traps: FocusInteraction | null = null;
  private _handlers: {
    root: HTMLElement;
    handler: (ev: { key: ExtendedInputKey; is_repeat: boolean }) => boolean;
  }[] = [];
  readonly on_focus_changed = new EventStream<HTMLElement | null>();
  readonly on_traps_changed = new EventStream<FocusInteraction | null>();
  readonly interactives = new WeakMap<HTMLElement, FocusInteraction>();

  constructor(readonly os: KateOS) {}

  setup() {
    this.os.kernel.console.on_key_pressed.listen(this.handle_input);
  }

  listen(
    root: HTMLElement,
    handler: (ev: { key: ExtendedInputKey; is_repeat: boolean }) => boolean
  ) {
    this._handlers.push({ root, handler });
  }

  remove(
    root: HTMLElement,
    handler: (ev: { key: ExtendedInputKey; is_repeat: boolean }) => boolean
  ) {
    this._handlers = this._handlers.filter(
      (x) => x.root !== root && x.handler !== handler
    );
  }

  register_interactive(element: HTMLElement, interactions: FocusInteraction) {
    this.interactives.set(element, interactions);
  }

  private should_handle(key: ExtendedInputKey) {
    return ["up", "down", "left", "right", "o"].includes(key);
  }

  get current_root() {
    return this._current_root;
  }

  get current_focus(): HTMLElement | null {
    return this._current_root?.querySelector(".focus") ?? null;
  }

  push_root(element: HTMLElement | null) {
    this._stack.push(this._current_root);
    this._current_root = element;
    this.on_focus_changed.emit(element);
    if (element != null && element.querySelector(".focus") == null) {
      this.refocus();
    }
  }

  pop_root(expected: HTMLElement | null) {
    if (expected != this._current_root) {
      console.warn(`pop_root() with unexpected root`, {
        expected,
        current: this._current_root,
      });
      return;
    }
    if (this._stack.length > 0) {
      this._current_root = this._stack.pop()!;
      this.on_focus_changed.emit(this._current_root);
      this.focus(this.current_focus);
    } else {
      throw new Error(`pop_root() on an empty focus stack`);
    }
  }

  handle_input = ({
    key,
    is_repeat,
  }: {
    key: ExtendedInputKey;
    is_repeat: boolean;
  }) => {
    if (this._current_root == null) {
      return;
    }

    for (const { root, handler } of this._handlers) {
      if (this._current_root === root) {
        if (handler({ key, is_repeat })) {
          return;
        }
      }
    }

    const current_focus = this.current_focus;
    if (current_focus != null) {
      const traps = this.interactives.get(current_focus);
      if (traps != null) {
        const trap = traps.handlers.find(
          (x) =>
            x.key.includes(key as InputKey) &&
            (!is_repeat || x.allow_repeat) &&
            (x.enabled == null || x.enabled())
        );
        if (trap != null) {
          trap.handler(key as InputKey, is_repeat);
          return;
        }
      }
    }

    if ((key === "capture" || key === "long_capture") && !is_repeat) {
      this.os.notifications.push_transient(
        "kate:focus-manager",
        "Capture unsupported",
        "Screen capture is not available right now."
      );
      return;
    }

    if (!this.should_handle(key)) {
      return;
    }

    const focusable = (
      Array.from(
        this._current_root.querySelectorAll(".kate-ui-focus-target")
      ) as HTMLElement[]
    ).map((x) => {
      const rect = x.getBoundingClientRect();

      return {
        element: x,
        position: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom,
        },
      };
    });
    const right_limit = Math.max(...focusable.map((x) => x.position.right));
    const bottom_limit = Math.max(...focusable.map((x) => x.position.bottom));

    const current = focusable.find((x) =>
      x.element.classList.contains("focus")
    );
    const left = current?.position.x ?? -1;
    const top = current?.position.y ?? -1;
    const right = current?.position.right ?? right_limit + 1;
    const bottom = current?.position.bottom ?? bottom_limit + 1;

    switch (key) {
      case "o": {
        if (current != null && !is_repeat) {
          this.os.sfx.play("select");
          current.element.click();
        }
        break;
      }

      case "up": {
        const candidates = focusable
          .filter((x) => x.position.bottom < bottom)
          .sort((a, b) => b.position.bottom - a.position.bottom);
        const closest = candidates.sort(
          (a, b) =>
            Math.abs(a.position.x - left) - Math.abs(b.position.x - left)
        );
        this.focus(closest[0]?.element, key);
        break;
      }

      case "down": {
        const candidates = focusable
          .filter((x) => x.position.y > top)
          .sort((a, b) => a.position.y - b.position.y);
        const closest = candidates.sort(
          (a, b) =>
            Math.abs(a.position.x - left) - Math.abs(b.position.x - left)
        );
        this.focus(closest[0]?.element, key);
        break;
      }

      case "left": {
        const candidates = focusable
          .filter((x) => x.position.right < right)
          .sort((a, b) => b.position.right - a.position.right);
        const closest = candidates.sort(
          (a, b) => Math.abs(a.position.y - top) - Math.abs(b.position.y - top)
        );
        this.focus(closest[0]?.element, key);
        break;
      }

      case "right": {
        const candidates = focusable
          .filter((x) => x.position.x > left)
          .sort((a, b) => a.position.x - b.position.x);
        const closest = candidates.sort(
          (a, b) => Math.abs(a.position.y - top) - Math.abs(b.position.y - top)
        );
        this.focus(closest[0]?.element, key);
        break;
      }
    }
  };

  refocus() {
    if (this.current_focus != null || this._current_root == null) {
      return;
    }

    const root = this._current_root;
    const candidates0 = Array.from(
      root.querySelectorAll(".kate-ui-focus-target")
    ) as HTMLElement[];
    const candidates1 = candidates0.map(
      (x) => [x.getBoundingClientRect(), x] as const
    );
    const candidates = candidates1.sort(([ra, _], [rb, __]) => ra.top - rb.top);
    const candidate = candidates[0]?.[1];
    this.focus(candidate);
  }

  focus(element: HTMLElement | null, key: ExtendedInputKey | null = null) {
    if (element == null || this._current_root == null) {
      if (key != null) {
        this.os.sfx.play("invalid");
      }
      return;
    }

    if (key != null) {
      this.os.sfx.play("cursor");
    }
    for (const x of Array.from(this._current_root.querySelectorAll(".focus"))) {
      x.classList.remove("focus");
    }
    element.focus();
    element.classList.add("focus");
    element.scrollIntoView({
      block: "center",
      inline: "center",
    });

    const traps = this.interactives.get(element) ?? null;
    if (traps === this._previous_traps) {
      return;
    }
    this._previous_traps = traps;
    if (traps != null) {
      this.on_traps_changed.emit(traps);
    } else {
      this.on_traps_changed.emit(null);
    }
  }
}
