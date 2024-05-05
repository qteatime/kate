/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { capabilities } from "../..";
import * as Cart from "../../cart";
import type { DeveloperProfile } from "../../data";
import type { KateButton } from "../../kernel";
import { EventStream, Observable, load_image_from_bytes } from "../../utils";
import type { InteractionHandler } from "../apis";
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

function set_attr(element: HTMLElement, key: string, value: string | boolean) {
  if (typeof value === "string") {
    element.setAttribute(key, value);
  } else if (typeof value === "boolean") {
    if (value) {
      element.setAttribute(key, key);
    } else {
      element.removeAttribute(key);
    }
  }
}

export function h(tag: string, attrs: { [key: string]: string | boolean }, children: Widgetable[]) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    set_attr(element, key, value);
  }
  for (const child of children) {
    append(child, element);
  }
  return element;
}

export function klass(name: string, children: Widgetable[]) {
  return h("div", { class: name }, children);
}

export function svg(tag: string, attrs: { [key: string]: string }, children: SVGElement[]) {
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

export function to_node(x: Widgetable) {
  let content = x instanceof Widget ? render(x) : x;
  if (typeof content === "string") {
    return document.createTextNode(content);
  } else if (content != null) {
    return content;
  } else {
    return document.createDocumentFragment();
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
    return h("div", { class: "kate-ui-hbox", style: `gap: ${this.gap}rem` }, this.children);
  }
}

export function hbox(gap: number, children: Widgetable[]) {
  return new HBox(gap, children);
}

export function flow(children: Widgetable[]) {
  return h("div", { class: "kate-ui-flow" }, children);
}

export function paragraph(children: Widgetable[]) {
  return h("div", { class: "kate-ui-paragraph" }, [flow(children)]);
}

export function stack(children: Widgetable[]) {
  return h("div", { class: "kate-ui-stack" }, children);
}

export class VBox extends Widget {
  constructor(readonly gap: number, readonly children: Widgetable[]) {
    super();
  }

  render() {
    return h("div", { class: "kate-ui-vbox", style: `gap: ${this.gap}rem` }, this.children);
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
      h("div", { class: "kate-ui-title-bar-child" }, [this.children.left ?? null]),
      h("div", { class: "kate-ui-title-bar-child" }, [this.children.middle ?? null]),
      h("div", { class: "kate-ui-title-bar-child" }, [this.children.right ?? null]),
    ]);
  }
}

export class Space extends Widget {
  constructor(readonly x: { width?: number; height?: number }, readonly display: string) {
    super();
  }

  render() {
    return h(
      "div",
      {
        class: "kate-ui-space",
        style: `width: ${this.x.width ?? 0}px; height: ${this.x.height ?? 0}px; display: ${
          this.display
        }`,
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
    title?: string;
    rel?: string;
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
        title: x.title ?? "",
        rel: x.rel ?? "",
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

export function image(src: string) {
  return h("img", { src: src }, []);
}

export function icon_button(icon: KateButton | KateButton[], text: string) {
  if (typeof icon === "string") {
    return new Button([new HBox(0.5, [new Icon(icon), text])]).focus_target(false);
  } else {
    return new Button([new HBox(0.5, [...icon.map((x) => new Icon(x)), text])]).focus_target(false);
  }
}

export function fa_icon_button(name: string, text: string, spacing = 0.5) {
  return new Button([new HBox(spacing, [fa_icon(name), text])]);
}

export function text_button(
  os: KateOS,
  text: string,
  x: {
    status_label?: string;
    on_click: () => void;
    dangerous?: boolean;
    primary?: boolean;
    enabled?: Observable<boolean>;
  }
) {
  return interactive(
    os,
    h(
      "button",
      {
        class: "kate-ui-button kate-ui-text-button",
        "data-dangerous": x.dangerous ?? false,
        "data-primary": x.primary ?? false,
      },
      [text]
    ),
    [
      {
        key: ["o"],
        label: x.status_label ?? "Ok",
        on_click: true,
        handler: () => x.on_click(),
        enabled: () => x.enabled?.value ?? true,
      },
    ],
    {
      enabled: x.enabled,
    }
  );
}

export function text(x: Widgetable[]) {
  return h("div", { class: "kate-ui-text" }, x);
}

export function meta_text(x: Widgetable[]) {
  return h("div", { class: "kate-ui-meta-text" }, x);
}

export function mono_text(x: Widgetable[]) {
  return h("div", { class: "kate-ui-mono-text" }, x);
}

export function strong(x: Widgetable[]) {
  return h("strong", {}, x);
}

export function chip(x: Widgetable[]) {
  return h("div", { class: "kate-ui-chip" }, x);
}

export class Icon extends Widget {
  constructor(readonly type: KateButton) {
    super();
  }

  render() {
    switch (this.type) {
      case "up":
      case "down":
      case "right":
      case "left":
        return h("div", { class: "kate-icon", "data-name": this.type }, [
          h("img", { src: `img/buttons/dpad-${this.type}.png` }, []),
        ]);
      case "ltrigger":
        return h("div", { class: "kate-icon", "data-name": this.type }, [
          h("img", { src: `img/buttons/l.png` }, []),
        ]);
      case "rtrigger":
        return h("div", { class: "kate-icon", "data-name": this.type }, [
          h("img", { src: `img/buttons/r.png` }, []),
        ]);
      case "x":
        return h("div", { class: "kate-icon", "data-name": this.type }, [
          h("img", { src: `img/buttons/cancel.png` }, []),
        ]);
      case "o":
        return h("div", { class: "kate-icon", "data-name": this.type }, [
          h("img", { src: `img/buttons/ok.png` }, []),
        ]);
      case "menu":
      case "capture":
      case "berry":
      case "sparkle":
        return h("div", { class: "kate-icon", "data-name": this.type }, [
          h("img", { src: `img/buttons/${this.type}.png` }, []),
        ]);
    }
  }
}

export function icon(x: KateButton) {
  return new Icon(x);
}

export function button_icon(
  x:
    | "cancel"
    | "capture"
    | "dpad-down"
    | "dpad-fill"
    | "dpad-horizontal"
    | "dpad-left"
    | "dpad-lower"
    | "dpad-right"
    | "dpad-stroke"
    | "dpad-up"
    | "dpad-upper"
    | "dpad-vertical"
    | "l"
    | "menu"
    | "ok"
    | "r"
) {
  if (!/^[a-z\-]+$/.test(x)) {
    throw new Error(`Invalid name`);
  }

  return h("div", { class: "kate-button-icon", "data-icon": x }, [
    h("img", { src: `img/buttons/${x}.png` }, []),
  ]);
}

export function status_bar(children: Widgetable[]) {
  return h("div", { class: "kate-os-statusbar" }, [...children]);
}

export function fa_icon(
  name: string,
  size: "2xs" | "xs" | "1x" | "lg" | "xl" | "2x" | "3x" | "4x" | "5x" | "6x" | "7x" | "8x" = "1x",
  style: "solid" = "solid",
  animation?: "spin" | "bounce" | "beat" | null
) {
  const anim = animation == null ? "" : `fa-${animation}`;
  return h("i", { class: `fa-${style} fa-${size} fa-${name} ${anim}` }, []);
}

export function focusable_container(children: Widgetable[]) {
  return h("div", { class: "kate-ui-focusable-container kate-ui-focus-target" }, [...children]);
}

export function info_line(label: Widgetable, data: Widgetable[], x?: { interactive?: boolean }) {
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

export function inline(x: Widgetable) {
  return klass("kate-ui-inline", [x]);
}

export function button_panel(
  os: KateOS,
  x: {
    title: string;
    description?: string;
    dangerous?: boolean;
    status_label?: string;
    on_click: () => void;
  }
) {
  return interactive(
    os,
    h(
      "button",
      {
        class: "kate-ui-button-panel",
        "data-dangerous": x.dangerous ?? false,
      },
      [
        h("div", { class: "kate-ui-button-panel-title" }, [x.title]),
        h("div", { class: "kate-ui-button-panel-description" }, [x.description ?? ""]),
      ]
    ),
    [
      {
        key: ["o"],
        label: x.status_label ?? "Ok",
        on_click: true,
        handler: () => x.on_click(),
      },
    ],
    {
      dangerous: x.dangerous,
    }
  );
}

export function toggle_cell(
  os: KateOS,
  x: {
    title: Widgetable;
    description: Widgetable;
    value: boolean | Observable<boolean>;
    on_label?: Widgetable;
    off_label?: Widgetable;
    on_changed?: (value: boolean) => void;
    readonly?: boolean;
  }
) {
  const checked = Observable.from(x.value);
  const readonly = x.readonly ?? false;
  const mutate = typeof x.value === "boolean" ? (v: boolean) => (checked.value = v) : () => {};
  const container = h("div", { class: "kate-ui-toggle-container" }, [
    h("div", { class: "kate-ui-toggle-view" }, [h("div", { class: "kate-ui-toggle-bullet" }, [])]),
    h("div", { class: "kate-ui-toggle-label-yes" }, [x.on_label ?? "ON "]),
    h("div", { class: "kate-ui-toggle-label-no" }, [x.off_label ?? "OFF"]),
  ]);

  container.classList.toggle("active", checked.value);
  checked.stream.listen((x) => {
    container.classList.toggle("active", x);
  });

  return interactive(
    os,
    h("div", { class: "kate-ui-info-line", "data-readonly": readonly }, [
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
          if (readonly) {
            return;
          }
          const value = !checked.value;
          x.on_changed?.(value);
          mutate(value);
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
  const container = h("div", { class: "kate-ui-toggle-container kate-ui-focus-target" }, [
    h("div", { class: "kate-ui-toggle-view" }, [h("div", { class: "kate-ui-toggle-bullet" }, [])]),
    h("div", { class: "kate-ui-toggle-label-yes" }, [x.enabled ?? "YES"]),
    h("div", { class: "kate-ui-toggle-label-no" }, [x.disabled ?? "NO "]),
  ]);

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
    icon?: string | Widgetable;
    arrow?: string;
    title: Widgetable;
    description?: Widgetable;
    value?: Widgetable;
    click_label?: string;
    on_click?: () => void;
  }
) {
  const element = h("div", { class: "kate-ui-link-card kate-ui-focus-target" }, [
    h("div", { class: "kate-ui-link-card-icon" }, [
      x.icon == null ? null : typeof x.icon === "string" ? fa_icon(x.icon, "2x") : x.icon,
    ]),
    h("div", { class: "kate-ui-link-card-text" }, [
      h("div", { class: "kate-ui-link-card-title" }, [x.title]),
      h("div", { class: "kate-ui-link-card-description" }, [x.description ?? null]),
    ]),
    h("div", { class: "kate-ui-link-card-value" }, [x.value ?? null]),
    h(
      "div",
      {
        class: "kate-ui-link-card-arrow",
        "data-value-suffix": x.value != null,
      },
      [
        x.arrow != null
          ? fa_icon(x.arrow, x.value == null ? "xl" : "1x")
          : fa_icon("chevron-right", x.value == null ? "xl" : "1x"),
      ]
    ),
  ]);
  if (x.on_click) {
    element.classList.add("kate-ui-link-card-clickable");
    element.classList.remove("kate-ui-focus-target");
    return interactive(os, element, [
      {
        key: ["o"],
        on_click: true,
        label: x.click_label ?? "Ok",
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
  return h("div", { class: "kate-os-simple-screen", "data-title": stringify(x.title) }, [
    new Title_bar({
      left: fragment([fa_icon(x.icon, "lg"), new Section_title(x.title)]),
      right: x.subtitle,
    }),
    x.body,
    x.status ? statusbar([...x.status]) : null,
  ]);
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
  return new Space({ height: x }, "block");
}

export function hspace(x: number) {
  return new Space({ width: x }, "inline-block");
}

export function vdivider() {
  return h("div", { class: "kate-ui-vertical-divider" }, []);
}

export function interactive(
  os: KateOS,
  child: Widgetable,
  interactions: InteractionHandler[],
  x?: {
    default_focus_indicator?: boolean;
    dangerous?: boolean;
    enabled?: Observable<boolean>;
    replace?: boolean;
    focused?: boolean;
  }
) {
  const as_element = (child: Widgetable) => {
    if (!(child instanceof HTMLElement)) {
      throw new Error("invalid element for interactive");
    }
    return child;
  };

  let element: HTMLElement;
  if (x?.replace) {
    element = as_element(child);
    element.classList.add("kate-ui-interactive");
    element.classList.add("kate-ui-focus-target");
  } else {
    element = document.createElement("div");
    element.className = "kate-ui-interactive kate-ui-focus-target";
    append(child, element);
  }

  if (x?.default_focus_indicator === false) {
    element.setAttribute("data-custom-focus", "custom-focus");
  }

  if (x?.dangerous === true) {
    element.setAttribute("data-dangerous", "dangerous");
  }

  if (x?.focused === true) {
    element.classList.add("focus");
  }

  os.focus_handler.register_interactive(element, { handlers: interactions });

  const click_handler = interactions.find((x) => x.on_click);
  if (click_handler != null) {
    element.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (click_handler.enabled?.() !== false) {
        click_handler.handler("o", false);
      }
    });
  }

  const menu_handler = interactions.find((x) => x.on_menu);
  if (menu_handler != null) {
    element.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      if (menu_handler.enabled?.() !== false) {
        menu_handler.handler("menu", false);
      }
    });
  }

  if (x?.enabled != null) {
    set_attr(element, "disabled", !x.enabled.value);
    x.enabled.stream.listen((enabled) => {
      set_attr(element, "disabled", !enabled);
    });
  }

  return element;
}

export function padded_container(
  padding: "s" | "1x" | "lg" | "2x" | "3x" | "4x",
  children: Widgetable[]
) {
  return h("div", { class: "kate-ui-padded-container", "data-padding": padding }, [...children]);
}

export function centered_container(child: Widgetable) {
  return h("div", { class: "kate-ui-centered-container" }, [child]);
}

export function dynamic(x: Observable<Widgetable>) {
  let installed = false;

  const canvas = document.createElement("div");
  canvas.className = "kate-ui-dynamic";
  append(x.value, canvas);

  x.stream.listen((widget) => {
    if (canvas.isConnected) {
      installed = true;
      canvas.textContent = "";
      append(widget, canvas);
    } else if (!installed) {
      canvas.textContent = "";
      append(widget, canvas);
    }
  });

  return canvas;
}

export function hchoices(gap: number, choices: Widgetable[]) {
  return h("div", { class: "kate-ui-hchoices", style: `gap: ${gap}rem` }, choices);
}

export function choice_button(
  os: KateOS,
  content: Widgetable,
  x?: { selected?: Observable<boolean>; on_select?: () => void }
) {
  const element = h("div", { class: "kate-ui-choice-button" }, [content]);
  element.classList.toggle("active", x?.selected?.value ?? false);
  x?.selected?.stream.listen((active) => {
    element.classList.toggle("active", active);
  });
  return interactive(os, element, [
    {
      key: ["o"],
      on_click: true,
      label: "Select",
      handler: () => {
        x?.on_select?.();
      },
    },
  ]);
}

export function menu_separator() {
  return h("div", { class: "kate-ui-menu-separator" }, []);
}

export function section(x: { title: Widgetable; contents: Widgetable[] }) {
  return h("div", { class: "kate-ui-section" }, [
    h("h3", { class: "kate-ui-section-heading" }, [x.title]),
    h("div", { class: "kate-ui-section-contents" }, x.contents),
  ]);
}

export function stack_bar(x: {
  total: number;
  minimum_component_size?: number;
  free?: { title: string; display_value: string };
  components: { title: string; value: number; display_value: string }[];
  skip_zero_value?: boolean;
}) {
  const colours = [
    "var(--color-1)",
    "var(--color-2)",
    "var(--color-3)",
    "var(--color-4)",
    "var(--color-5)",
  ];
  const skip_zero = x.skip_zero_value !== false;
  const components = x.components.filter((x) => (skip_zero ? x.value > 0 : true));
  return h("div", { class: "kate-ui-stack-bar-container stack-horizontal" }, [
    h("div", { class: "kate-ui-stack-bar" }, [
      ...components.map((a, i) =>
        h(
          "div",
          {
            class: "kate-ui-stack-bar-component",
            style: `--stack-bar-color: ${colours[i % colours.length]}; --stack-bar-size: ${Math.max(
              x.minimum_component_size ?? 0,
              a.value / x.total
            )};`,
            title: a.title,
          },
          []
        )
      ),
    ]),
    h("div", { class: "kate-ui-stack-bar-legend" }, [
      ...components.map((a, i) =>
        h(
          "div",
          {
            class: "kate-ui-stack-bar-legend-item",
            style: `--stack-bar-color: ${colours[i % colours.length]};`,
          },
          [`${a.title} (${a.display_value})`]
        )
      ),
      x.free
        ? h(
            "div",
            {
              class: "kate-ui-stack-bar-legend-item",
              style: `--stack-bar-color: var(--color-border-d1)`,
            },
            [`${x.free.title} (${x.free.display_value})`]
          )
        : null,
    ]),
  ]);
}

export function no_thumbnail(text: string = "") {
  return h("div", { class: "kate-no-thumbnail" }, [text]);
}

export function cartridge_chip(cart: Cart.CartMeta) {
  const risk = capabilities.risk_from_cartridge(cart);

  return h("div", { class: "kate-ui-cartridge-chip", "data-risk": risk }, [
    h("div", { class: "kate-ui-cartridge-chip-thumbnail" }, [
      no_thumbnail(),
      // TODO: reimplement
      // thumbnail_file == null
      //   ? no_thumbnail()
      //   : load_image_from_bytes("application/octet-stream", thumbnail_file.data),
    ]),
    h("div", { class: "kate-ui-cartridge-chip-info" }, [
      h("div", { class: "kate-ui-cartridge-chip-title" }, [cart.metadata.presentation.title]),
      h("div", { class: "kate-ui-cartridge-chip-id" }, [cart.id]),
      h("div", { class: "kate-ui-cartridge-chip-meta" }, [line_field("Version:", cart.version)]),
      h("div", { class: "kate-ui-cartridge-chip-risk" }, [line_field("Risk:", risk)]),
    ]),
  ]);
}

export function line_field(title: Widgetable, value: Widgetable) {
  return hbox(1, [strong([title]), value]);
}

export function text_ellipsis(text: Widgetable[]) {
  return klass("kate-ui-text-ellipsis", text);
}

export function select_panel<A>(
  os: KateOS,
  options: {
    click_label?: string;
    arrow?: string;
    process_id: string;
    title: string;
    description?: string;
    initial_value: A;
    choices: { label: string; value: A }[];
    render_value?: (_: A) => Widgetable;
    on_changed?: (_: A) => void;
  }
) {
  const value = Observable.from(options.initial_value);
  const cancelled = { __cancelled: true };
  return add_class(
    link_card(os, {
      arrow: options.arrow ?? "pencil",
      click_label: options.click_label ?? "Change",
      title: options.title,
      description: options.description ?? "",
      value: dynamic(value.map<Widgetable>((x) => options.render_value?.(x) ?? String(x))),
      on_click: async () => {
        const result = await os.dialog.pop_menu(
          options.process_id,
          options.title,
          options.choices,
          cancelled as any
        );
        if (result == cancelled) {
          return;
        }
        value.value = result;
        options.on_changed?.(result);
      },
    }),
    ["kate-ui-select-panel"]
  );
}

type Form = {
  observe_value(name: string): Observable<string | null>;
};
export function form(fn: (form: Form) => Widgetable[]) {
  const form: Form = {
    observe_value(name: string) {
      let field: HTMLInputElement | null = null;
      const result = Observable.from<string | null>(null, () => {
        field?.removeEventListener("change", update);
        field?.removeEventListener("keyup", update);
      });
      const update = () => {
        if (result.value !== field!.value) {
          result.value = field!.value;
        }
      };
      const listen = () => {
        field = form_element.querySelector(
          `input[name=${JSON.stringify(name)}]`
        ) as HTMLInputElement;
        if (field == null) {
          setTimeout(listen, 1000);
        } else {
          result.value = field.value;
          field.addEventListener("change", update);
          field.addEventListener("keyup", update);
          result;
        }
      };
      setTimeout(listen);
      return result;
    },
  };
  const form_element = h("form", {}, []);
  const children = fn(form);
  for (const child of children) {
    append(child, form_element);
  }
  return form_element;
}

export type AutoComplete = "username" | "new-password" | "current-password" | "one-time-code";

export function text_input(
  os: KateOS,
  x: {
    initial_value?: string;
    name?: string;
    type: "text" | "password";
    placeholder?: string;
    autocomplete?: AutoComplete[];
    write_to?: Observable<string>;
  }
) {
  const input = h(
    "input",
    {
      type: x.type,
      name: x.name ?? "",
      value: x.initial_value ?? "",
      placeholder: x.placeholder ?? "",
      autocomplete: x.autocomplete == null ? "" : x.autocomplete.join(" "),
      class: "kate-ui-text-input-input",
    },
    []
  ) as HTMLInputElement;
  if (x.write_to != null) {
    const output = x.write_to;
    const update = () => {
      if (output.value !== input.value) {
        output.value = input.value;
      }
    };
    input.addEventListener("change", update);
    input.addEventListener("keyup", update);
  }
  input.addEventListener("keydown", (ev) => {
    if (ev.code === "ArrowUp" || ev.code === "ArrowDown") {
      input.blur();
      ev.preventDefault();
      return;
    }
    ev.stopPropagation();
    if (ev.code === "Escape") {
      input.blur();
      ev.preventDefault();
      return;
    }
  });
  const validation = Observable.from<Widgetable>(null);
  return h("div", { class: "kate-ui-text-input-control" }, [
    interactive(
      os,
      input,
      [
        {
          key: ["o"],
          label: "Edit",
          on_click: true,
          handler: () => {
            input.focus();
          },
        },
      ],
      {
        replace: true,
        default_focus_indicator: false,
      }
    ),
    dynamic(validation),
  ]);
}

export function field(title: string, children: Widgetable[]) {
  return klass("kate-ui-form-field", [
    h("label", { class: "kate-ui-form-field-label" }, [title]),
    ...children,
  ]);
}

export function lazy(x: Promise<Widgetable>) {
  const element = klass("kate-ui-lazy", []);
  x.then(
    (value) => {
      append(value, element);
    },
    (error) => {
      console.error(`Failed to resolve lazy element`, error);
      append(klass("kate-ui-lazy-error", [String(error)]), element);
    }
  );
  return element;
}

export function multistep(
  os: KateOS,
  steps: {
    content: Widgetable;
    next_label?: string;
    previous_label?: string;
    valid?: Observable<boolean>;
    on_next?: () => Promise<void>;
    on_previous?: () => Promise<void>;
  }[]
) {
  const current = new Observable<number>(0);
  const content = current.map<Widgetable>((x) => steps[x].content);
  const actions = current.map<Widgetable>((x) => {
    const step = steps[x];

    return klass("kate-ui-step-actions", [
      klass("kate-ui-step-previous", [
        when(x > 0, [
          text_button(os, step.previous_label ?? "Back", {
            on_click: async () => {
              if (step.on_previous) await step.on_previous();
              current.value = Math.max(0, x - 1);
            },
          }),
        ]),
      ]),
      klass("kate-ui-step-view", [
        ...steps.map((_, i) => {
          return klass(`kate-ui-step-icon ${i === x ? "active" : ""}`, []);
        }),
      ]),
      klass("kate-ui-step-next", [
        when(x < steps.length - 1, [
          text_button(os, step.next_label ?? "Continue", {
            enabled: step.valid,
            on_click: async () => {
              if (step.on_next) await step.on_next();
              current.value = Math.min(steps.length - 1, x + 1);
            },
          }),
        ]),
      ]),
    ]);
  });

  return klass("kate-ui-steps", [
    klass("kate-ui-steps-content", [dynamic(content)]),
    dynamic(actions),
  ]);
}

export function tabs<A>(
  os: KateOS,
  x: {
    selected?: A;
    out?: Observable<A>;
    choices: { icon?: Widgetable; title: Widgetable; value: A }[];
  }
) {
  const current = new Observable<A | null>(x.selected ?? null);
  return klass("kate-ui-tab-bar", [
    hchoices(2, [
      ...x.choices.map((c) => {
        return choice_button(
          os,
          klass("kate-ui-tab-button", [
            klass("kate-ui-tab-button-icon", [c.icon ?? null]),
            klass("kate-ui-tab-button-title", [c.title]),
          ]),
          {
            selected: current.map((x) => x === c.value),
            on_select: () => {
              current.value = c.value;
              if (x.out != null) x.out.value = c.value;
            },
          }
        );
      }),
    ]),
  ]);
}

function add_class(x: HTMLElement, classes: string[]) {
  x.classList.add(...classes);
  return x;
}

export function developer_profile_chip(profile: DeveloperProfile) {
  return klass("kate-ui-developer-profile-chip", [
    klass("kate-ui-developer-profile-name", [profile.name]),
    klass("kate-ui-developer-profile-domain", [profile.domain]),
    klass("kate-ui-developer-profile-fingerprint", [profile.fingerprint]),
  ]);
}

export function grid(x: {
  layout: string[][];
  column_sizes?: string[];
  row_sizes?: string[];
  gap?: string;
  content: { [key: string]: Widgetable };
}) {
  return with_style(
    {
      "grid-template-areas": x.layout.map((l) => JSON.stringify(l.join(" "))).join(" "),
      "grid-template-columns": x.column_sizes?.join(" "),
      "grid-template-rows": x.row_sizes?.join(" "),
      gap: x.gap,
    },
    klass("kate-ui-grid", [
      ...Object.entries(x.content).map(([area, widget]) => {
        return with_style(
          { "grid-area": area, overflow: "hidden" },
          klass("kate-ui-grid-cell", [widget])
        );
      }),
    ])
  );
}

export function with_style(
  rules: { [key: string]: string | null | undefined },
  child: HTMLElement
) {
  for (const [key, value] of Object.entries(rules)) {
    if (value != null) {
      child.style[key as any] = value;
    }
  }
  return child;
}

export function with_class(klass: string, child: HTMLElement) {
  child.className += ` ${klass}`;
  return child;
}
