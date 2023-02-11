import { InputKey } from "../../kernel/virtual";
import { EventStream } from "../../../../util/build/events";

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

export class Button extends Widget {
  private _on_clicked = new EventStream<void>();

  constructor(readonly children: Widgetable[]) {
    super();
  }

  on_clicked(fn: () => void) {
    this._on_clicked.listen(fn);
    return this;
  }

  render() {
    const element = h(
      "button",
      { class: "kate-ui-button kate-ui-focus-target" },
      this.children
    );
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
