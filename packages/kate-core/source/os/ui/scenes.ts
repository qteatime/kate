import type { ExtendedInputKey } from "../../kernel";
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

export abstract class SimpleScene extends Scene {
  abstract icon: string;
  abstract title: Widgetable[];
  subtitle: Widgetable | null = null;
  abstract body(): Widgetable[];

  render() {
    return simple_screen({
      icon: this.icon,
      title: this.title,
      subtitle: this.subtitle,
      body: scroll([
        h("div", { class: "kate-os-content kate-os-screen-body" }, this.body()),
      ]),
      status: [
        icon_button("x", "Return").on_clicked(this.handle_close),
        icon_button("o", "Open").on_clicked(this.handle_open),
      ],
    });
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

  on_attached(): void {
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  handle_key_pressed = (x: { key: ExtendedInputKey; is_repeat: boolean }) => {
    if (x.is_repeat) {
      return false;
    }

    switch (x.key) {
      case "o":
        this.handle_open();
        return true;

      case "x":
        this.handle_close();
        return true;
    }
    return false;
  };

  handle_close = () => {
    this.os.pop_scene();
  };

  handle_open = () => {
    const current = this.os.focus_handler.current_focus;
    if (current != null) {
      current.click();
    }
  };
}
