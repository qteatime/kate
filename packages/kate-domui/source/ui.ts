import { assets } from "./assets";
import { Css, Widget } from "./widget";

export class KateUI {
  private children: Widget[] = [];
  private focus_target: Set<Widget> = new Set();
  private current_focus: Widget | null = null;

  private constructor(
    readonly docroot: HTMLElement,
    readonly root: HTMLElement
  ) {}

  static from_root(root: HTMLElement) {
    const ui_root = document.createElement("div");
    ui_root.className = "kate-ui-root";

    const css = new Css(assets["kate-domui.css"]).render();
    ui_root.appendChild(css);
    const screen = document.createElement("div");
    screen.className = "kate-ui-screen";
    ui_root.appendChild(screen);

    root.appendChild(ui_root);
    return new KateUI(ui_root, screen);
  }

  clear() {
    for (const child of this.children) {
      child.detach();
    }
    this.root.textContent = "";
  }

  draw(widget: Widget) {
    this.children.push(widget);
    widget.attach(this.root, this);
  }

  add_css(code: string) {
    const element = new Css(code).render();
    this.docroot.appendChild(element);
  }

  remove_focusable(widget: Widget) {
    this.focus_target.delete(widget);
    if (this.current_focus == widget) {
      widget.set_focused(false);
      this.current_focus = null;
    }
  }

  add_focusable(widget: Widget) {
    this.focus_target.add(widget);
    if (this.current_focus == null) {
      widget.set_focused(true);
      this.current_focus = widget;
    }
  }
}