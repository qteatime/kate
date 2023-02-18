import type { ExtendedInputKey, InputKey } from "../../kate-api/build/input";
import type { KateUI } from "./ui";
import { Observable } from "./observable";
import { LiveNode } from "./transform";

export function h(
  tag: string,
  attrs: { [key: string]: string },
  children: Node[]
) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    element.appendChild(child);
  }
  return element;
}

export abstract class Widget {
  raw_node: Node | null = null;
  is_focusable = false;
  ui: KateUI | null = null;

  abstract render(): Node | null;
  on_attached(): void {}
  on_detached(): void {}
  on_focus(): void {}
  on_blur(): void {}

  get live_node() {
    if (this.raw_node instanceof HTMLElement) {
      return new LiveNode(this.raw_node);
    } else {
      throw new Error(`Invalid type: not an HTMLElement`);
    }
  }

  attach(parent: Node, ui: KateUI) {
    this.ui = ui;
    if (this.raw_node == null) {
      this.raw_node = this.render();
    }

    const node = this.raw_node;
    if (node != null) {
      parent.appendChild(node);
    }
    this.on_attached();
  }

  detach() {
    if (this.raw_node != null) {
      this.raw_node.parentNode?.removeChild(this.raw_node);
      this.raw_node = null;
    }
    this.on_detached();
    this.ui = null;
  }

  set_focused(focused: boolean) {
    if (this.raw_node instanceof HTMLElement) {
      if (focused) {
        this.raw_node.classList.add("kate-focus");
        this.on_focus();
      } else {
        this.raw_node.classList.remove("kate-focus");
        this.on_blur();
      }
    }
  }
}

export class Text extends Widget {
  constructor(readonly value: string) {
    super();
  }

  render() {
    return document.createTextNode(this.value);
  }
}

export class Box extends Widget {
  constructor(
    readonly tag: string,
    readonly class_names: string,
    readonly children: Widget[]
  ) {
    super();
  }

  attach(parent: Node, ui: KateUI): void {
    super.attach(parent, ui);
    for (const child of this.children) {
      child.attach(this.raw_node!, ui);
    }
  }

  detach(): void {
    for (const child of this.children) {
      child.detach();
    }
    super.detach();
  }

  render() {
    const element = document.createElement(this.tag);
    element.className = this.class_names;
    return element;
  }
}

export class Image extends Widget {
  constructor(readonly url: string) {
    super();
  }

  render() {
    const element = document.createElement("img");
    element.src = this.url;
    return element;
  }
}

export class Icon extends Widget {
  constructor(readonly type: InputKey) {
    super();
  }

  render() {
    switch (this.type) {
      case "up":
      case "down":
      case "right":
      case "left":
        return h(
          "div",
          { class: "kate-icon kate-icon-light", "data-name": this.type },
          []
        );
      case "ltrigger":
      case "rtrigger":
      case "menu":
      case "capture":
        return h("div", { class: "kate-icon", "data-name": this.type }, []);
      case "x":
        return h("div", { class: "kate-icon", "data-name": this.type }, []);
      case "o":
        return h("div", { class: "kate-icon", "data-name": this.type }, []);
    }
  }
}

export class Fragment extends Widget {
  constructor(readonly children: Widget[]) {
    super();
  }

  attach(parent: Node, ui: KateUI): void {
    super.attach(parent, ui);
    for (const child of this.children) {
      child.attach(this.raw_node!, ui);
    }
  }

  detach(): void {
    for (const child of this.children) {
      child.detach();
    }
    super.detach();
  }

  render() {
    const fragment = document.createDocumentFragment();
    return fragment;
  }
}

export class Space extends Widget {
  constructor(readonly size_px: number) {
    super();
  }

  render() {
    return h(
      "div",
      {
        class: "kate-ui-space",
        style: `width: ${this.size_px}px; height: ${this.size_px}px`,
      },
      []
    );
  }
}

export class FocusTarget extends Widget {
  private is_focused = false;

  constructor(
    readonly child: Widget,
    readonly focused: Observable<boolean>,
    readonly on: {
      focus: () => void;
      blur: () => void;
    }
  ) {
    super();
  }

  attach(parent: Node, ui: KateUI): void {
    super.attach(parent, ui);
    this.child.on_attached();
    this.ui?.add_focusable(this);
    this.focused.stream.listen(this.update_focus);
    this.update_focus(this.focused.value);
  }

  detach(): void {
    this.child.on_detached();
    super.detach();
    this.focused.stream.remove(this.update_focus);
    this.ui?.remove_focusable(this);
  }

  render() {
    return h("div", { class: "kate-focus-target" }, []);
  }

  update_focus = (value: boolean) => {
    if (value === this.is_focused) {
      return;
    }

    if (value) {
      this.on_focus();
    } else {
      this.on_blur();
    }
  };

  on_focus(): void {
    this.is_focused = true;
    this.on.focus.call(this);
  }

  on_blur(): void {
    this.is_focused = false;
    this.on.blur.call(this);
  }
}

export class Keymap extends Widget {
  private active: boolean = true;

  constructor(
    readonly mapping: Partial<Record<InputKey, () => Promise<boolean>>>
  ) {
    super();
  }

  render() {
    return null;
  }

  on_attached(): void {
    KateAPI.timer.on_tick.listen(this.handle_input);
  }

  on_detached(): void {
    KateAPI.timer.on_tick.remove(this.handle_input);
  }

  handle_input = async () => {
    if (!this.active) {
      return;
    }

    for (const [key, handler] of Object.entries(this.mapping)) {
      if (KateAPI.input.is_down(key as InputKey)) {
        this.active = false;
        this.active = await handler();
        break;
      }
    }
  };
}

export class KeyEventMap extends Widget {
  private active: boolean = true;

  constructor(
    readonly mapping: Partial<Record<ExtendedInputKey, () => Promise<boolean>>>
  ) {
    super();
  }

  render() {
    return null;
  }

  on_attached(): void {
    KateAPI.input.on_key_pressed.listen(this.handle_input);
  }

  on_detached(): void {
    KateAPI.input.on_key_pressed.remove(this.handle_input);
  }

  handle_input = async (key: ExtendedInputKey) => {
    if (!this.active) {
      return;
    }

    const handler = this.mapping[key];
    if (handler != null) {
      this.active = false;
      this.active = await handler();
    }
  };
}

export class Dynamic extends Widget {
  private current: Widget | null = null;

  constructor(readonly value: Observable<Widget>) {
    super();
  }

  attach(parent: Node, ui: KateUI): void {
    super.attach(parent, ui);
    this.current?.attach(this.raw_node!, ui);
  }

  detach(): void {
    this.current?.detach();
    super.detach();
  }

  render() {
    const element = document.createElement("div");
    element.className = "kate-dynamic";
    return element;
  }

  on_attached(): void {
    this.value.stream.listen(this.on_update);
  }

  on_detached(): void {
    this.value.stream.remove(this.on_update);
  }

  private get canvas(): HTMLElement {
    return this.raw_node as any;
  }

  on_update = (value: Widget) => {
    this.current?.detach();
    this.canvas.textContent = "";
    value.attach(this.canvas, this.ui!);
    this.current = value;
  };
}

export class Css extends Widget {
  constructor(readonly code: string) {
    super();
  }

  render() {
    const style = document.createElement("style");
    style.textContent = this.code;
    return style;
  }
}
