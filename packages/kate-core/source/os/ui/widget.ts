import { InputKey } from "../../kernel/virtual";
import { EventStream } from "../../utils";

export abstract class Widget {
  abstract render(): Widgetable;

  with_classes(names: string[]) {
    return new WithClass(names, this);
  }
}

export type Widgetable = null | string | Node | Widget;

export function fragment(children: Widgetable[]) {
  const x = document.createDocumentFragment();
  for (const child of children) {
    append(child, x);
  }
  return x;
}

export function h(
  tag: string,
  attrs: { [key: string]: string },
  children: Widgetable[]
) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    append(child, element);
  }
  return element;
}

export function svg(
  tag: string,
  attrs: { [key: string]: string },
  children: SVGElement[]
) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    element.appendChild(child);
  }
  return element;
}

export function render(x: Widget): null | string | Node {
  const element = x.render();
  if (element instanceof Widget) {
    return render(element);
  } else {
    return element;
  }
}

export function append(child: Widgetable, to: Node) {
  let content = child instanceof Widget ? render(child) : child;
  if (typeof content === "string") {
    to.appendChild(document.createTextNode(content));
  } else if (content != null) {
    to.appendChild(content);
  }
}

export class WithClass extends Widget {
  constructor(readonly classes: string[], readonly child: Widget) {
    super();
  }

  render() {
    const element = render(this.child);
    if (element instanceof HTMLElement) {
      for (const k of this.classes) {
        element.classList.add(k);
      }
    }
    return element;
  }
}

export class HBox extends Widget {
  constructor(readonly gap: number, readonly children: Widgetable[]) {
    super();
  }

  render() {
    return h(
      "div",
      { class: "kate-ui-hbox", style: `gap: ${this.gap}px` },
      this.children
    );
  }
}

export class VBox extends Widget {
  constructor(readonly gap: number, readonly children: Widgetable[]) {
    super();
  }

  render() {
    return h(
      "div",
      { class: "kate-ui-vbox", style: `gap: ${this.gap}px` },
      this.children
    );
  }
}

export class Title_bar extends Widget {
  constructor(
    readonly children: {
      left?: Widgetable;
      middle?: Widgetable;
      right?: Widgetable;
    }
  ) {
    super();
  }

  render() {
    return h("div", { class: "kate-ui-title-bar" }, [
      h("div", { class: "kate-ui-title-bar-child" }, [
        this.children.left ?? null,
      ]),
      h("div", { class: "kate-ui-title-bar-child" }, [
        this.children.middle ?? null,
      ]),
      h("div", { class: "kate-ui-title-bar-child" }, [
        this.children.right ?? null,
      ]),
    ]);
  }
}

export class Space extends Widget {
  constructor(readonly x: { width?: number; height?: number }) {
    super();
  }

  render() {
    return h(
      "div",
      {
        class: "kate-ui-space",
        style: `width: ${this.x.width ?? 0}px; height: ${this.x.height ?? 0}px`,
      },
      []
    );
  }
}

export class Section_title extends Widget {
  constructor(readonly children: Widgetable[]) {
    super();
  }

  render() {
    return h("div", { class: "kate-ui-section-title" }, this.children);
  }
}

export class Menu_list extends Widget {
  constructor(readonly children: Widgetable[]) {
    super();
  }

  render() {
    return h("div", { class: "kate-ui-menu-list" }, this.children);
  }
}

export class If extends Widget {
  constructor(
    readonly condition: () => boolean,
    readonly child: { then: Widgetable; else: Widgetable }
  ) {
    super();
  }

  render() {
    if (this.condition()) {
      return this.child.then;
    } else {
      return this.child.else;
    }
  }
}

export function when(condition: boolean, children: Widgetable[]) {
  if (condition) {
    return fragment(children);
  } else {
    return null;
  }
}

export class Button extends Widget {
  private _on_clicked = new EventStream<void>();
  private _is_focus_target = true;

  constructor(readonly children: Widgetable[]) {
    super();
  }

  on_clicked(fn: () => void) {
    this._on_clicked.listen(fn);
    return this;
  }

  focus_target(x: boolean) {
    this._is_focus_target = x;
    return this;
  }

  render() {
    const element = h("button", { class: "kate-ui-button" }, this.children);
    if (this._is_focus_target) {
      element.classList.add("kate-ui-focus-target");
    }
    element.addEventListener("click", (ev) => {
      ev.preventDefault();
      this._on_clicked.emit();
    });
    element.addEventListener("mouseenter", () => {
      element.classList.add("focus");
    });
    element.addEventListener("mouseleave", () => {
      element.classList.remove("focus");
    });
    return element;
  }
}

export function icon_button(icon: InputKey, text: string) {
  return new Button([new HBox(5, [new Icon(icon), text])]).focus_target(false);
}

export function fa_icon_button(name: string, text: string, spacing = 10) {
  return new Button([new HBox(spacing, [fa_icon(name), text])]);
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
          [h("img", { src: `img/${this.type}.png` }, [])]
        );
      case "ltrigger":
      case "rtrigger":
      case "menu":
      case "capture":
        return h("div", { class: "kate-icon", "data-name": this.type }, []);
      case "x":
        return h("div", { class: "kate-icon", "data-name": this.type }, [
          h("img", { src: `img/cancel.png` }, []),
        ]);
      case "o":
        return h("div", { class: "kate-icon", "data-name": this.type }, [
          h("img", { src: `img/ok.png` }, []),
        ]);
    }
  }
}

export function status_bar(children: Widgetable[]) {
  return h("div", { class: "kate-os-statusbar" }, [...children]);
}

export function fa_icon(
  name: string,
  size:
    | "2xs"
    | "xs"
    | "1x"
    | "lg"
    | "xl"
    | "2x"
    | "3x"
    | "4x"
    | "5x"
    | "6x"
    | "7x"
    | "8x" = "1x",
  style: "solid" = "solid"
) {
  return h("i", { class: `fa-${style} fa-${size} fa-${name}` }, []);
}

export function focusable_container(children: Widgetable[]) {
  return h(
    "div",
    { class: "kate-ui-focusable-container kate-ui-focus-target" },
    [...children]
  );
}

export function info_line(label: Widgetable, data: Widgetable[]) {
  return focusable_container([
    h("div", { class: "kate-ui-info-line" }, [
      h("div", { class: "kate-ui-info-line-label" }, [label]),
      h("div", { class: "kate-ui-info-line-data" }, [...data]),
    ]),
  ]);
}

export function legible_bg(children: Widgetable[]) {
  return h("div", { class: "kate-ui-legible-bg" }, [...children]);
}
