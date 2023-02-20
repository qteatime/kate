import { ExtendedInputKey } from "../../kernel/virtual";
import type { KateOS } from "../os";

export class KateFocusHandler {
  private _current_root: HTMLElement | null = null;

  constructor(readonly os: KateOS) {}

  setup() {
    this.os.kernel.console.on_key_pressed.listen(this.handle_input);
  }

  private should_handle(key: ExtendedInputKey) {
    return ["up", "down", "left", "right", "o"].includes(key);
  }

  get current_root() {
    return this._current_root;
  }

  change_root(element: HTMLElement | null) {
    this._current_root = element;
    if (element != null && element.querySelector(".focus") == null) {
      const candidates0 = Array.from(
        element.querySelectorAll(".kate-ui-focus-target")
      ) as HTMLElement[];
      const candidates = candidates0.sort(
        (a, b) => a.offsetLeft - b.offsetLeft
      );
      this.focus(candidates[0]);
    }
  }

  compare_and_change_root(
    element: HTMLElement | null,
    old: HTMLElement | null
  ) {
    if (this.current_root === old) {
      this.change_root(element);
      return true;
    } else {
      return false;
    }
  }

  focus_current_scene() {
    this.change_root(this.os.current_scene?.canvas ?? null);
  }

  handle_input = (key: ExtendedInputKey) => {
    if (this._current_root == null || !this.should_handle(key)) {
      return;
    }

    const focusable = (
      Array.from(
        this._current_root.querySelectorAll(".kate-ui-focus-target")
      ) as HTMLElement[]
    ).map((x) => ({
      element: x,
      position: {
        x: x.offsetLeft,
        y: x.offsetTop,
        width: x.offsetWidth,
        height: x.offsetHeight,
        right: x.offsetLeft + x.offsetWidth,
        bottom: x.offsetTop + x.offsetHeight,
      },
    }));
    const right_limit = Math.max(...focusable.map((x) => x.position.right));
    const bottom_limit = Math.max(...focusable.map((x) => x.position.bottom));

    const current = focusable.find((x) =>
      x.element.classList.contains("focus")
    );
    const left = current?.position.x ?? right_limit;
    const top = current?.position.y ?? bottom_limit;
    const right = current?.position.right ?? 0;
    const bottom = current?.position.bottom ?? 0;

    switch (key) {
      case "o": {
        if (current != null) {
          current.element.click();
        }
        break;
      }

      case "up": {
        const candidates = focusable
          .filter((x) => x.position.bottom <= top)
          .sort((a, b) => b.position.bottom - a.position.bottom);
        const closest = candidates.sort((a, b) => {
          return (
            Math.min(a.position.x - left, a.position.right - right) -
            Math.min(b.position.x - left, b.position.right - right)
          );
        });
        this.focus(closest[0]?.element);
        break;
      }

      case "down": {
        const candidates = focusable
          .filter((x) => x.position.y >= bottom)
          .sort((a, b) => a.position.y - b.position.y);
        const closest = candidates.sort((a, b) => {
          return (
            Math.min(a.position.x - left, a.position.right - right) -
            Math.min(b.position.x - left, b.position.right - right)
          );
        });
        this.focus(closest[0]?.element);
        break;
      }

      case "left": {
        const candidates = focusable
          .filter((x) => x.position.right <= left)
          .sort((a, b) => b.position.right - a.position.right);
        const closest = candidates.sort((a, b) => {
          return (
            Math.min(a.position.y - top, a.position.bottom - bottom) -
            Math.min(b.position.y - top, b.position.bottom - bottom)
          );
        });
        this.focus(closest[0]?.element);
        break;
      }

      case "right": {
        const candidates = focusable
          .filter((x) => x.position.x >= right)
          .sort((a, b) => a.position.x - b.position.x);
        const closest = candidates.sort((a, b) => {
          return (
            Math.min(a.position.y - top, a.position.bottom - bottom) -
            Math.min(b.position.y - top, b.position.bottom - bottom)
          );
        });
        this.focus(closest[0]?.element);
        break;
      }
    }
  };

  focus(element: HTMLElement | null) {
    if (element == null || this._current_root == null) {
      return;
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
  }
}
