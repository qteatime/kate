import type { ExtendedInputKey, InputKey } from "../../kernel";
import { Sets } from "../../utils";
import { FocusInteraction } from "../apis";
import type { KateOS } from "../os";
import {
  h,
  append,
  Widgetable,
  simple_screen,
  scroll,
  icon_button,
} from "./widget";

export abstract class Scene {
  readonly canvas: HTMLElement;
  constructor(protected os: KateOS) {
    this.canvas = h("div", { class: "kate-os-screen" }, []);
  }

  async attach(to: HTMLElement) {
    to.appendChild(this.canvas);
    this.canvas.innerHTML = "";
    append(this.render(), this.canvas);
    this.on_attached();
  }

  async detach() {
    this.canvas.remove();
    this.on_detached();
  }

  abstract render(): Widgetable;

  on_attached() {}
  on_detached() {}
}

export type Action = {
  key: InputKey[];
  label: string;
  handler: (key: InputKey, is_repeat: boolean) => void;
};

export abstract class SimpleScene extends Scene {
  abstract icon: string;
  abstract title: Widgetable[];
  subtitle: Widgetable | null = null;
  abstract body(): Widgetable[];
  readonly actions: Action[] = [
    {
      key: ["x"],
      label: "Return",
      handler: () => {
        this.os.pop_scene();
      },
    },
  ];
  private _previous_traps: FocusInteraction | null = null;

  render() {
    return simple_screen({
      icon: this.icon,
      title: this.title,
      subtitle: this.subtitle,
      body: this.body_container([
        h("div", { class: "kate-os-content kate-os-screen-body" }, this.body()),
      ]),
      status: [...this.actions.map((x) => this.render_action(x))],
    });
  }

  body_container(body: Widgetable[]) {
    return scroll(body);
  }

  replace_body(content: Widgetable[]) {
    const body = this.canvas.querySelector(".kate-os-screen-body");
    if (body != null) {
      body.textContent = "";
      for (const child of content) {
        append(child, body);
      }
    }
  }

  render_action(action: Action) {
    return icon_button(action.key, action.label).on_clicked(() =>
      action.handler(action.key[0], false)
    );
  }

  on_attached(): void {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    this.os.focus_handler.on_traps_changed.listen(
      this.update_status_with_traps
    );
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    this.os.focus_handler.on_traps_changed.remove(
      this.update_status_with_traps
    );
  }

  update_status_with_traps = (traps: FocusInteraction | null) => {
    if (this._previous_traps == null && traps == null) {
      return;
    }

    const handlers = traps?.handlers ?? [];
    if (this._previous_traps != null) {
      const new_keys = new Set(
        handlers.map((x) => `${x.key.join(",")}:${x.label}`)
      );
      const old_keys = new Set(
        this._previous_traps.handlers.map(
          (x) => `${x.key.join(" ")}:${x.label}`
        )
      );
      if (Sets.same_set(new_keys, old_keys)) {
        return;
      }
    }
    this._previous_traps = traps;

    const status = this.canvas.querySelector(".kate-os-statusbar") ?? null;
    if (status != null) {
      status.textContent = "";
      for (const action of this.actions) {
        append(this.render_action(action), status);
      }
      for (const handler of handlers) {
        append(
          icon_button(handler.key, handler.label).on_clicked(() => {
            handler.handler(handler.key[0], false);
          }),
          status
        );
      }
    }
  };

  handle_key_pressed = (x: { key: ExtendedInputKey; is_repeat: boolean }) => {
    if (x.is_repeat) {
      return false;
    }

    const handler = this.actions.find((h) => h.key.includes(x.key as InputKey));
    if (handler != null) {
      handler.handler(x.key as InputKey, x.is_repeat);
      return true;
    }
    return false;
  };
}
