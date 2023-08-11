import { Observable } from "./utils";
import type { InteractionHandler, UI } from "./core";

export type Widgetable = null | string | Node | Widget;

export function set_attribute(
  element: HTMLElement,
  key: string,
  value: string | boolean
) {
  if (typeof value === "string") {
    element.setAttribute(key, value);
  } else if (typeof value === "boolean") {
    if (value) {
      element.setAttribute(key, key);
    } else {
      element.removeAttribute(key);
    }
  } else {
    throw new Error(`Unsupported attribute type ${typeof value}`);
  }
}

export function append(parent: Node, child: Widgetable) {
  if (child == null) {
    return;
  }

  if (child instanceof Widget) {
    parent.appendChild(child.canvas);
    return;
  }

  if (typeof child === "string") {
    parent.appendChild(document.createTextNode(child));
    return;
  }

  parent.appendChild(child);
}

export function replace(parent: HTMLElement, child: Widgetable) {
  parent.textContent = "";
  append(parent, child);
}

export function h(
  tag: string,
  attributes: { [key: string]: string | boolean },
  children: Widgetable[]
) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    set_attribute(element, key, value);
  }
  for (const child of children) {
    append(element, child);
  }
  return element;
}

export function dynamic(x: {
  on_attached: (canvas: HTMLElement) => void;
  on_detached: (canvas: HTMLElement) => void;
}) {
  const element = document.createElement("kate-ui-dynamic");
  element.addEventListener("change", (ev) => {
    if (element.isConnected) {
      x.on_attached(element);
    } else {
      x.on_detached(element);
    }
  });
  return element;
}

export class KateUIDynamic extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.dispatchEvent(new Event("change"));
  }

  disconnectedCallback() {
    this.dispatchEvent(new Event("change"));
  }
}

customElements.define("kate-ui-dynamic", KateUIDynamic);

export function from_observable(x: Observable<Widgetable>) {
  let subscription: ((_: Widgetable) => void) | null = null;

  return dynamic({
    on_attached: (canvas) => {
      replace(canvas, x.value);
      if (subscription != null) {
        x.stream.remove(subscription);
      }
      subscription = x.stream.listen((widget) => replace(canvas, widget));
    },
    on_detached: (canvas) => {
      if (subscription != null) {
        x.stream.remove(subscription);
      }
    },
  });
}

export class Widget {
  constructor(readonly ui: UI, readonly canvas: HTMLElement) {}

  attr(attributes: { [key: string]: string | boolean }) {
    for (const [key, value] of Object.entries(attributes)) {
      set_attribute(this.canvas, key, value);
    }
    return this;
  }

  add_classes(classes: string[]) {
    this.canvas.classList.add(...classes);
    return this;
  }

  interactive(
    interactions: InteractionHandler[],
    x?: { custom_focus?: boolean }
  ) {
    this.ui.focus.register_interactions(this.canvas, interactions);
    this.canvas.classList.add("kate-ui-focus-target");
    if (x?.custom_focus === true) {
      this.canvas.setAttribute("data-custom-focus", "true");
    }
    return this;
  }
}

export class WidgetDSL {
  constructor(readonly ui: UI) {}

  h(
    tag: string,
    attributes: { [key: string]: string | boolean },
    children: Widgetable[]
  ) {
    return new Widget(this.ui, h(tag, attributes, children));
  }

  container(children: Widgetable[]) {
    return this.h("div", { class: `kate-ui-container` }, children);
  }

  class(classes: string, children: Widgetable[]) {
    return this.h("div", { class: classes }, children);
  }

  dynamic(observable: Observable<Widgetable>) {
    return from_observable(observable);
  }

  title_bar(x: { left?: Widgetable; middle?: Widgetable; right?: Widgetable }) {
    return this.class("kate-ui-title-bar", [
      this.class("kate-ui-title-bar-left", [x.left ?? null]),
      this.class("kate-ui-title-bar-middle", [x.middle ?? null]),
      this.class("kate-ui-title-bar-right", [x.right ?? null]),
    ]);
  }

  app_screen(x: { title?: Widgetable; body: Widgetable; status?: Widgetable }) {
    return this.class("kate-ui-app-screen", [
      this.class("kate-ui-app-screen-title", [x.title ?? null]),
      this.class("kate-ui-app-screen-body", [x.body]),
      this.class("kate-ui-app-screen-status", [x.status ?? null]),
    ]);
  }

  hero(x: { title?: Widgetable; subtitle?: Widgetable; content?: Widgetable }) {
    return this.class("kate-ui-hero", [
      this.class("kate-ui-hero-title", [x.title ?? null]),
      this.class("kate-ui-hero-subtitle", [x.subtitle ?? null]),
      this.class("kate-ui-hero-content", [x.content ?? null]),
    ]);
  }

  text_button(label: string, on_click?: () => void) {
    return this.h("button", { class: "kate-ui-text-button" }, [
      label,
    ]).interactive([
      {
        key: ["o"],
        label: "Ok",
        allow_repeat: false,
        handler: async () => {
          on_click?.();
        },
      },
    ]);
  }

  fragment(children: Widgetable[]) {
    const fragment = document.createDocumentFragment();
    for (const child of children) {
      append(fragment, child);
    }
    return fragment;
  }

  p(children: Widgetable[]) {
    return this.h("p", {}, children);
  }

  when(x: boolean, children: Widgetable[]) {
    if (x) {
      return this.fragment(children);
    } else {
      return null;
    }
  }

  multistep(
    steps: {
      content: Widgetable;
      next_label?: string;
      previous_label?: string;
      on_next?: () => Promise<void>;
      on_previous?: () => Promise<void>;
    }[]
  ) {
    const current = new Observable<number>(0);
    const content = current.map<Widgetable>((x) => steps[x].content);
    const actions = current.map<Widgetable>((x) => {
      const step = steps[x];

      return this.class("kate-ui-step-actions", [
        this.class("kate-ui-step-previous", [
          this.when(x > 0, [
            this.text_button(step.previous_label ?? "Back", async () => {
              if (step.on_previous) await step.on_previous();
              current.value = Math.max(0, x - 1);
            }),
          ]),
        ]),
        this.class("kate-ui-step-view", [
          ...steps.map((_, i) => {
            return this.class(
              `kate-ui-step-icon ${i === x ? "active" : ""}`,
              []
            );
          }),
        ]),
        this.class("kate-ui-step-next", [
          this.text_button(step.next_label ?? "Continue", async () => {
            if (step.on_next) await step.on_next();
            current.value = Math.min(steps.length - 1, x + 1);
          }),
        ]),
      ]);
    });

    return this.class("kate-ui-steps", [
      this.class("kate-ui-steps-content", [this.dynamic(content)]),
      this.dynamic(actions),
    ]);
  }

  meta_text(children: Widgetable[]) {
    return this.class("kate-ui-meta-text", children);
  }

  hspace(size: number) {
    return this.class("kate-ui-space", []).attr({ style: `width: ${size}rem` });
  }

  vspace(size: number) {
    return this.class("kate-ui-space", []).attr({
      style: `height: ${size}rem`,
    });
  }

  // text_input(
  //   initial_value: string,
  //   x: { query: string; on_change?: (value: string) => void }
  // ) {
  //   const value = new Observable<string>(initial_value);
  //   return this.class("kate-ui-text-input", [
  //     this.dynamic(value as Observable<Widgetable>),
  //     this.fa_icon("pen"),
  //   ]).interactive([
  //     {
  //       key: ["o"],
  //       label: "Edit",
  //       handler: async () => {
  //         const new_value = await KateAPI.dialog.input(x.query, {
  //           initial_value: value.value,
  //           type: "text",
  //         });
  //         if (new_value != null) {
  //           value.value = new_value;
  //           x.on_change?.(new_value);
  //         }
  //       },
  //     },
  //   ]);
  // }

  vbox(gap: number, children: Widgetable[]) {
    return this.class("kate-ui-vbox", children).attr({
      style: `gap: ${gap}rem`,
    });
  }

  hbox(gap: number, children: Widgetable[]) {
    return this.class("kate-ui-hbox", children).attr({
      style: `gap: ${gap}rem`,
    });
  }

  title(
    x: Widgetable[],
    level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" = "h1"
  ) {
    return this.h(level, { class: "kate-ui-title" }, x);
  }

  subtitle(
    x: Widgetable[],
    level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" = "h2"
  ) {
    return this.h(level, { class: "kate-ui-subtitle" }, x);
  }

  fa_icon(
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
    return this.h(
      "i",
      { class: `fa-${style} fa-${size} fa-${name} ${anim}` },
      []
    );
  }
}
