import { InputKey } from "../../kernel/virtual";
import { EventStream } from "../../utils";
import { InteractionHandler } from "../apis";
import type { KateOS } from "../os";

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

export function hbox(gap: number, children: Widgetable[]) {
  return new HBox(gap, children);
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

export function vbox(gap: number, children: Widgetable[]) {
  return new VBox(gap, children);
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

export function link(
  os: KateOS,
  text: Widgetable,
  x: {
    href?: string;
    target?: string;
    status_label?: string;
    on_click?: () => void;
  }
) {
  return interactive(
    os,
    h(
      "a",
      {
        class: "kate-ui-button-link kate-ui-focus-target",
        href: x.href ?? "#",
        target: x.target ?? "",
      },
      [text]
    ),
    [
      {
        key: ["o"],
        on_click: true,
        label: x.status_label ?? "Ok",
        handler: () => x.on_click?.(),
      },
    ]
  );
}

export function icon_button(icon: InputKey | InputKey[], text: string) {
  if (typeof icon === "string") {
    return new Button([new HBox(5, [new Icon(icon), text])]).focus_target(
      false
    );
  } else {
    return new Button([
      new HBox(5, [...icon.map((x) => new Icon(x)), text]),
    ]).focus_target(false);
  }
}

export function fa_icon_button(name: string, text: string, spacing = 10) {
  return new Button([new HBox(spacing, [fa_icon(name), text])]);
}

export function text_button(
  os: KateOS,
  text: string,
  x: { status_label?: string; on_click: () => void }
) {
  return interactive(
    os,
    h("button", { class: "kate-ui-button kate-ui-text-button" }, [text]),
    [
      {
        key: ["o"],
        label: x.status_label ?? "Ok",
        on_click: true,
        handler: () => x.on_click(),
      },
    ]
  );
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

export function icon(x: InputKey) {
  return new Icon(x);
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
  style: "solid" = "solid",
  animation?: "spin" | "bounce" | "beat" | null
) {
  const anim = animation == null ? "" : `fa-${animation}`;
  return h("i", { class: `fa-${style} fa-${size} fa-${name} ${anim}` }, []);
}

export function focusable_container(children: Widgetable[]) {
  return h(
    "div",
    { class: "kate-ui-focusable-container kate-ui-focus-target" },
    [...children]
  );
}

export function info_line(
  label: Widgetable,
  data: Widgetable[],
  x?: { interactive?: boolean }
) {
  const info = [
    h("div", { class: "kate-ui-info-line" }, [
      h("div", { class: "kate-ui-info-line-label" }, [label]),
      h("div", { class: "kate-ui-info-line-data" }, [...data]),
    ]),
  ];
  if (x?.interactive !== true) {
    return focusable_container(info);
  } else {
    return fragment(info);
  }
}

export function info_cell(label: Widgetable, data: Widgetable[]) {
  return info_line(label, data, { interactive: true });
}

export function toggle_cell(
  os: KateOS,
  x: {
    title: Widgetable;
    description: Widgetable;
    value: boolean;
    on_label?: Widgetable;
    off_label?: Widgetable;
    on_changed?: (value: boolean) => void;
  }
) {
  let checked = x.value;
  const container = h("div", { class: "kate-ui-toggle-container" }, [
    h("div", { class: "kate-ui-toggle-view" }, [
      h("div", { class: "kate-ui-toggle-bullet" }, []),
    ]),
    h("div", { class: "kate-ui-toggle-label-yes" }, [x.on_label ?? "ON "]),
    h("div", { class: "kate-ui-toggle-label-no" }, [x.off_label ?? "OFF"]),
  ]);

  container.classList.toggle("active", checked);

  return interactive(
    os,
    h("div", { class: "kate-ui-info-line" }, [
      h("div", { class: "kate-ui-info-line-label" }, [
        text_panel({ title: x.title, description: x.description }),
      ]),
      h("div", { class: "kate-ui-info-line-data" }, [container]),
    ]),
    [
      {
        key: ["o"],
        label: "Toggle",
        on_click: true,
        handler: () => {
          checked = !checked;
          container.classList.toggle("active", checked);
          x.on_changed?.(checked);
        },
      },
    ]
  );
}

export function toggle(
  os: KateOS,
  value: boolean,
  x: {
    enabled?: Widgetable;
    disabled?: Widgetable;
    on_changed?: (value: boolean) => void;
  } = {}
) {
  let checked = value;
  const container = h(
    "div",
    { class: "kate-ui-toggle-container kate-ui-focus-target" },
    [
      h("div", { class: "kate-ui-toggle-view" }, [
        h("div", { class: "kate-ui-toggle-bullet" }, []),
      ]),
      h("div", { class: "kate-ui-toggle-label-yes" }, [x.enabled ?? "YES"]),
      h("div", { class: "kate-ui-toggle-label-no" }, [x.disabled ?? "NO "]),
    ]
  );

  container.classList.toggle("active", checked);

  return interactive(os, container, [
    {
      key: ["o"],
      label: "Toggle",
      on_click: true,
      handler: () => {
        checked = !checked;
        container.classList.toggle("active", checked);
        x.on_changed?.(checked);
      },
    },
  ]);
}

export function legible_bg(children: Widgetable[]) {
  return h("div", { class: "kate-ui-legible-bg" }, [...children]);
}

export function link_card(
  os: KateOS,
  x: {
    icon: string;
    title: string;
    description: string;
    on_click?: () => void;
  }
) {
  const element = h(
    "div",
    { class: "kate-ui-link-card kate-ui-focus-target" },
    [
      h("div", { class: "kate-ui-link-card-icon" }, [fa_icon(x.icon, "2x")]),
      h("div", { class: "kate-ui-link-card-text" }, [
        h("div", { class: "kate-ui-link-card-title" }, [x.title]),
        h("div", { class: "kate-ui-link-card-description" }, [x.description]),
      ]),
    ]
  );
  if (x.on_click) {
    element.classList.add("kate-ui-link-card-clickable");
    element.classList.remove("kate-ui-focus-target");
    return interactive(os, element, [
      {
        key: ["o"],
        on_click: true,
        label: "Ok",
        handler: () => x.on_click?.(),
      },
    ]);
  } else {
    return element;
  }
}

export function statusbar(children: Widgetable[]) {
  return h("div", { class: "kate-os-statusbar" }, [...children]);
}

export function scroll(children: Widgetable[]) {
  return h("div", { class: "kate-os-scroll" }, [...children]);
}

export function stringify(children: Widgetable[]) {
  const element = document.createElement("div");
  for (const child of children) {
    append(child, element);
  }
  return element.textContent ?? "";
}

export function simple_screen(x: {
  icon: string;
  title: Widgetable[];
  subtitle?: Widgetable | null;
  body: Widgetable;
  status?: Widgetable[] | null;
}) {
  return h(
    "div",
    { class: "kate-os-simple-screen", "data-title": stringify(x.title) },
    [
      new Title_bar({
        left: fragment([fa_icon(x.icon, "lg"), new Section_title(x.title)]),
        right: x.subtitle,
      }),
      x.body,
      x.status ? statusbar([...x.status]) : null,
    ]
  );
}

export function text_panel(x: { title: Widgetable; description: Widgetable }) {
  return h("div", { class: "kate-ui-text-panel" }, [
    h("div", { class: "kate-ui-text-panel-title" }, [x.title]),
    h("div", { class: "kate-ui-text-panel-description" }, [x.description]),
  ]);
}

export function padding(amount: number, children: Widgetable[]) {
  return h("div", { style: `padding: ${amount}px` }, [...children]);
}

export function p(children: Widgetable[]) {
  return h("p", {}, [...children]);
}

export function button(
  text: Widgetable,
  x: {
    on_clicked?: () => void;
    focus_target?: boolean;
  }
) {
  const button = new Button([text]);
  button.focus_target(x.focus_target ?? true);
  if (x.on_clicked != null) {
    button.on_clicked(x.on_clicked);
  }
  return button;
}

export function vspace(x: number) {
  return new Space({ height: x });
}

export function hspace(x: number) {
  return new Space({ width: x });
}

export function vdivider() {
  return h("div", { class: "kate-ui-vertical-divider" }, []);
}

export function interactive(
  os: KateOS,
  child: Widgetable,
  interactions: InteractionHandler[],
  x?: { default_focus_indicator?: boolean }
) {
  const element = document.createElement("div");
  element.className = "kate-ui-interactive kate-ui-focus-target";
  append(child, element);

  if (x?.default_focus_indicator === false) {
    element.setAttribute("data-custom-focus", "custom-focus");
  }

  os.focus_handler.register_interactive(element, { handlers: interactions });

  const click_handler = interactions.find((x) => x.on_click);
  if (click_handler != null) {
    element.addEventListener("click", (ev) => {
      ev.preventDefault();
      click_handler.handler("o", false);
    });
  }

  const menu_handler = interactions.find((x) => x.on_menu);
  if (menu_handler != null) {
    element.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      menu_handler.handler("menu", false);
    });
  }

  return element;
}

export function padded_container(
  padding: "s" | "1x" | "lg" | "2x" | "3x" | "4x",
  children: Widgetable[]
) {
  return h(
    "div",
    { class: "kate-ui-padded-container", "data-padding": padding },
    [...children]
  );
}
