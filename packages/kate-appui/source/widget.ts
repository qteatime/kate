/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventStream, Observable, unreachable } from "./utils";
import { PopMenuItem, type InteractionHandler, type UI, type UIScene } from "./core";

export type ActionItem = {
  icon?: Widgetable;
  side_icon?: Widgetable;
  title: Widgetable;
  description?: Widgetable;
  value?: Widgetable;
  dangerous?: boolean;
  on_select: () => void;
  is_visible?: boolean;
};

export type SelectionItem<A> = {
  icon?: Widgetable;
  title: Widgetable;
  description?: Widgetable;
  value: A;
  options: SelectionOption<A>[];
  unknown_value?: Widgetable;
  on_change: (value: A) => void;
};

export type SelectionOption<A> = {
  icon?: Widgetable;
  label: Widgetable;
  value: A;
  is_visible?: () => boolean;
};

export type HorizontalSelection<A> = {
  title: Widgetable;
  description?: Widgetable;
  value: A;
  options: HorizontalSelectionItem<A>[];
  on_change: (value: A) => void;
};

export type HorizontalSelectionItem<A> = {
  icon: Widgetable;
  title?: Widgetable;
  value: A;
  is_visible?: boolean;
};

export type MenuItem = {
  icon?: Widgetable;
  title: Widgetable;
  on_select: () => void;
  is_visible?: boolean;
};

export type Keymap = Partial<
  Record<KateTypes.InputKey, { label: string; action: () => void; enabled?: boolean }>
>;

export type ReleaseType = "prototype" | "early-access" | "beta" | "demo" | "regular" | "unofficial";

export type ContentRating = "general" | "teen-and-up" | "mature" | "explicit" | "unknown";

export type ButtonIcon =
  | "berry"
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
  | "sparkle";

export type Widgetable = null | string | Node | Widget;
export type Size =
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
  | "8x";
export type IconStyle = "solid";
export type IconAnimation = "spin" | "spin-pulse" | "bounce" | "beat";
export type BoxJustify = "";
export type BoxAlign = "";

export function set_attribute(element: HTMLElement, key: string, value: string | boolean) {
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

function handle_observable_change(canvas: HTMLElement, value: any) {
  replace(canvas, value);
}

export function from_observable<A>(
  input: Observable<A>,
  x?: {
    on_attached?: (canvas: HTMLElement, value: A) => void;
    on_changed?: (canvas: HTMLElement, value: A) => void;
    on_detached?: (canvas: HTMLElement) => void;
  }
) {
  let subscription: ((_: A) => void) | null = null;
  const on_attached = x?.on_attached ?? handle_observable_change;
  const on_changed = x?.on_changed ?? handle_observable_change;

  return dynamic({
    on_attached: (canvas) => {
      on_attached(canvas, input.value);
      if (subscription != null) {
        input.stream.remove(subscription);
      }
      subscription = input.stream.listen((widget) => on_changed(canvas, widget));
    },
    on_detached: (canvas) => {
      if (subscription != null) {
        input.stream.remove(subscription);
      }
      x?.on_detached?.(canvas);
    },
  });
}

export class Widget {
  constructor(readonly ui: UI, readonly canvas: HTMLElement) {}

  attr(attributes: { [key: string]: string | boolean | null | undefined }) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value != null) {
        set_attribute(this.canvas, key, value);
      }
    }
    return this;
  }

  add_classes(classes: string[]) {
    this.canvas.classList.add(...classes);
    return this;
  }

  style(rules: { [key: string]: string | null | undefined }) {
    for (const [key, value] of Object.entries(rules)) {
      if (value != null) {
        this.canvas.style[key as any] = value;
      }
    }
    return this;
  }

  replace(content: Widgetable) {
    replace(this.canvas, content);
    return this;
  }

  dynamic<A>(x: Observable<A>, update: (widget: Widget, value: A) => void) {
    return new Widget(
      this.ui,
      from_observable(x, {
        on_attached: (canvas, value) => {
          replace(canvas, this.canvas);
          update(this, value);
        },
        on_changed: (canvas, value) => {
          update(this, value);
        },
      })
    );
  }

  interactive(interactions: InteractionHandler[], x?: { custom_focus?: boolean }) {
    this.ui.focus.register_interactions(this.canvas, interactions);
    this.canvas.classList.add("kate-ui-focus-target");
    if (x?.custom_focus === true) {
      this.canvas.setAttribute("data-custom-focus", "true");
    }
    const click_handler = interactions.find((x) => x.on_click);
    if (click_handler != null) {
      this.canvas.addEventListener("click", (ev) => {
        ev.preventDefault();
        click_handler.handler(click_handler.key[0], false);
      });
    }
    const menu_handler = interactions.find((x) => x.on_menu);
    if (menu_handler != null) {
      this.canvas.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        menu_handler.handler(menu_handler.key[0], false);
      });
    }
    return this;
  }
}

export class WidgetDSL {
  constructor(readonly ui: UI) {}

  h(tag: string, attributes: { [key: string]: string | boolean }, children: Widgetable[]) {
    return new Widget(this.ui, h(tag, attributes, children));
  }

  container(children: Widgetable[]) {
    return this.h("div", { class: `kate-ui-container` }, children);
  }

  class(classes: string, children: Widgetable[]) {
    return this.h("div", { class: classes }, children);
  }

  dynamic<A>(
    observable: Observable<A>,
    x?: {
      on_attached?: (canvas: HTMLElement, value: A) => void;
      on_changed?: (canvas: HTMLElement, value: A) => void;
      on_detached?: (canvas: HTMLElement) => void;
    }
  ) {
    return from_observable(observable, x);
  }

  subscription_manager(
    fn: (subscribe: <A>(observable: Observable<A>, fn: (_: A) => void) => void) => Widgetable
  ) {
    const subscriptions: {
      stream: EventStream<any>;
      subscription: (_: any) => void;
    }[] = [];
    const subscribe = <A>(observable: Observable<A>, fn: (_: A) => void) => {
      subscriptions.push({
        stream: observable.stream,
        subscription: observable.stream.listen(fn),
      });
    };

    return dynamic({
      on_attached: (canvas) => {
        replace(canvas, fn(subscribe));
      },
      on_detached: (canvas) => {
        for (const { stream, subscription } of subscriptions) {
          stream.remove(subscription);
        }
      },
    });
  }

  title_bar(x: { left?: Widgetable; middle?: Widgetable; right?: Widgetable }) {
    return this.class("kate-ui-title-bar", [
      this.class("kate-ui-title-bar-left", [x.left ?? null]),
      this.class("kate-ui-title-bar-middle", [x.middle ?? null]),
      this.class("kate-ui-title-bar-right", [x.right ?? null]),
    ]);
  }

  status_bar(children: Widgetable[]) {
    return this.class("kate-ui-statusbar", children);
  }

  button_icon(x: ButtonIcon) {
    return h("div", { class: "kate-ui-button-icon", "data-icon": x }, []);
  }

  key_icon(x: KateTypes.InputKey) {
    return this.button_icon(key_to_button(x));
  }

  status_icon(xs: ButtonIcon[], label: string) {
    return this.class("kate-ui-status-icon", [
      this.class("kate-ui-status-icon-list", [...xs.map((x) => this.button_icon(x))]),
      label,
    ]);
  }

  dynamic_status_icons() {
    const render = (x: InteractionHandler) => {
      return this.status_icon(x.key.map(key_to_button), x.label);
    };
    const handlers = Observable.from_stream(this.ui.focus.on_handlers_changed, {
      focus: [],
      scene: [],
    });
    return this.dynamic(
      handlers.map((x) => {
        return this.class("kate-ui-dynamic-status-icons", [
          ...x.focus.map((x) => render(x)),
          ...x.scene.map((x) => render(x)),
        ]);
      })
    );
  }

  app_screen(x: { title?: Widgetable; body: Widgetable; status?: Widgetable }) {
    return this.class("kate-ui-app-screen", [
      this.class("kate-ui-app-screen-title", [x.title ?? null]),
      this.class("kate-ui-app-screen-body", [x.body]),
      this.class("kate-ui-app-screen-status", [x.status ?? null]),
    ]);
  }

  two_panel_screen(x: { left: Widgetable; right: Widgetable }) {
    return this.class("kate-ui-bold-screen", [
      this.class("kate-ui-bold-screen-left", [x.left]),
      this.class("kate-ui-bold-screen-right", [x.right]),
    ]);
  }

  hero(x: { title?: Widgetable; subtitle?: Widgetable; content?: Widgetable }) {
    return this.class("kate-ui-hero", [
      this.class("kate-ui-hero-title", [x.title ?? null]),
      this.class("kate-ui-hero-subtitle", [x.subtitle ?? null]),
      this.class("kate-ui-hero-content", [x.content ?? null]),
    ]);
  }

  floating_button(x: { label?: Widgetable; icon?: Widgetable; on_click?: () => void }) {
    return this.h("button", { class: "kate-ui-floating-button kate-ui-text-button" }, [
      this.class("kate-ui-floating-button-icon", [x.icon ?? null]),
      this.class("kate-ui-floating-button-label", [x.label ?? null]),
    ]).interactive([
      {
        key: ["o"],
        label: "Ok",
        allow_repeat: false,
        on_click: true,
        handler: async () => {
          x.on_click?.();
        },
      },
    ]);
  }

  text_button(label: string, on_click?: () => void) {
    return this.h("button", { class: "kate-ui-text-button" }, [label]).interactive([
      {
        key: ["o"],
        label: "Ok",
        allow_repeat: false,
        on_click: true,
        handler: async () => {
          on_click?.();
        },
      },
    ]);
  }

  page_bullet(current: Observable<number>, x: { total: number; max_size?: number }) {
    function chunk(index: number) {
      if (x.max_size == null) {
        return {
          before: index,
          after: Math.max(0, x.total - index - 1),
          hidden_before: 0,
          hidden_after: 0,
        };
      } else {
        const size = Math.floor(x.max_size / 2);
        let before = size;
        let after = x.max_size - size;
        if (index < before) {
          after += before - index;
          before = index;
        } else if (index + 1 + after > x.total) {
          before += index + 1 + after - x.total;
          after = x.total - index - 1;
        }

        const before1 = Math.max(0, Math.min(before, Math.min(index, x.max_size)));
        const after1 = Math.max(0, Math.min(after, Math.min(x.total - 1, x.max_size)));

        return {
          before: before1,
          after: after1,
          hidden_before: Math.max(0, index - before1),
          hidden_after: Math.max(0, x.total - after1 - index - 1),
        };
      }
    }

    return this.dynamic(
      current.map<Widgetable>((a) => {
        const chunks = chunk(a);
        const before_banner =
          chunks.hidden_before > 0
            ? this.class("kate-ui-page-banner", ["+" + String(chunks.hidden_before)])
            : null;
        const after_banner =
          chunks.hidden_after > 0
            ? this.class("kate-ui-page-banner", ["+" + String(chunks.hidden_after)])
            : null;
        const pages_before = Array.from({ length: chunks.before }, (_) =>
          this.class("kate-ui-page-bullet", [])
        );
        const pages_after = Array.from({ length: chunks.after }, (_) =>
          this.class("kate-ui-page-bullet", [])
        );
        return this.class("kate-ui-page-bullets", [
          before_banner,
          ...pages_before,
          this.class("kate-ui-page-bullet kate-ui-current-page", [String(a)]),
          ...pages_after,
          after_banner,
        ]);
      })
    );
  }

  action_list(items: ActionItem[]) {
    return this.class("kate-ui-action-list", [
      ...items
        .filter((x) => x.is_visible !== false)
        .map((x) =>
          this.class("kate-ui-action-list-item", [
            this.class("kate-ui-action-list-icon", [x.icon ?? null]),
            this.class("kate-ui-action-list-title", [x.title ?? null]),
            this.class("kate-ui-action-list-description", [x.description ?? null]),
            this.class("kate-ui-action-list-value", [x.value ?? null]),
            this.class("kate-ui-action-list-side-icon", [x.side_icon ?? null]),
          ])
            .attr({ "data-dangerous": x.dangerous })
            .interactive([
              {
                key: ["o"],
                label: "Ok",
                on_click: true,
                handler: async () => {
                  x.on_select();
                },
              },
            ])
        ),
    ]);
  }

  select_panel<A>(x: SelectionItem<A>) {
    const current = new Observable(x.value);

    return this.action_list([
      {
        icon: x.icon,
        title: x.title,
        description: x.description,
        side_icon: this.fa_icon("pencil"),
        value: this.dynamic(
          current.map(
            (v) => x.options.find((o) => o.value === v)?.label ?? x.unknown_value ?? "(Unknown)"
          )
        ),
        on_select: async () => {
          const items = x.options.map<PopMenuItem<any>>((x) => ({
            title: x.label,
            icon: x.icon,
            is_visible: x.is_visible?.() ?? true,
            value: x.value,
          }));
          const result = await this.ui.dialogs.pop_menu({
            title: [x.title],
            cancel_value: null,
            items: items,
          });
          if (result != null) {
            current.value = result;
            x.on_change(result);
          }
        },
      },
    ]).add_classes(["kate-ui-select-panel"]);
  }

  menu_list(items: MenuItem[]) {
    return this.class("kate-ui-menu-list", [
      ...items
        .filter((x) => x.is_visible !== false)
        .map((x) =>
          this.class("kate-ui-menu-list-item", [
            this.class("kate-ui-menu-list-icon", [x.icon ?? null]),
            this.class("kate-ui-menu-list-title", [x.title ?? null]),
          ]).interactive([
            {
              key: ["o"],
              label: "Ok",
              on_click: true,
              handler: async () => {
                x.on_select();
              },
            },
          ])
        ),
    ]);
  }

  horizontal_selection<A>(x: HorizontalSelection<A>) {
    const current = new Observable(x.value);

    return this.class("kate-ui-horizontal-selection", [
      this.class("kate-ui-horizontal-selection-title", [x.title]),
      this.class("kate-ui-horizontal-selection-description", [x.description ?? null]),
      this.class("kate-ui-horizontal-selection-options", [
        this.dynamic(
          current.map((v) => {
            return this.fragment([
              ...x.options
                .filter((x) => x.is_visible ?? true)
                .map((option) => {
                  return this.class("kate-ui-horizontal-selection-option", [
                    this.class("kate-ui-horizontal-selection-option-icon", [option.icon]),
                    this.class("kate-ui-horizontal-selection-option-title", [option.title ?? null]),
                  ])
                    .attr({ "data-selected": v === option.value })
                    .interactive([
                      {
                        key: ["o"],
                        label: "Select",
                        on_click: true,
                        handler: async () => {
                          current.value = option.value;
                          x.on_change(option.value);
                        },
                      },
                    ]);
                }),
            ]);
          })
        ),
      ]),
    ]);
  }

  icon_button(
    icon: string,
    options: {
      on_click?: () => void;
      label?: string;
      layout?: "left" | "top";
      style?: IconStyle;
      size?: Size;
      animation?: IconAnimation;
    }
  ) {
    return this.h("button", { class: "kate-ui-icon-button" }, [
      this.class("kate-ui-icon-button-icon", [
        this.fa_icon(icon, options.size, options.style, options.animation),
      ]),
      this.class("kate-ui-icon-button-label", [options.label ?? null]),
    ]).interactive([
      {
        key: ["o"],
        label: "Ok",
        allow_repeat: false,
        on_click: true,
        handler: async () => {
          options.on_click?.();
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

  img(src: string) {
    return this.h("img", { src, class: "kate-ui-image" }, []);
  }

  when(x: boolean, children: Widgetable[]) {
    if (x) {
      return this.fragment(children);
    } else {
      return null;
    }
  }

  lazy(
    entry: Promise<Widgetable> | (() => Promise<Widgetable>),
    error_widget: Widgetable = "Failed to load"
  ) {
    const x = typeof entry === "function" ? entry() : entry;
    const widget = this.class("kate-ui-lazy", []);
    x.then(
      (value) => {
        widget.replace(value);
        this.ui.focus.ensure_focus();
      },
      (error) => {
        console.error(`Failed to load widget:`, error);
        widget.replace(error_widget);
      }
    );
    return widget;
  }

  keymap(scene: UIScene, mapping: Keymap) {
    const handlers: InteractionHandler[] = Object.entries(mapping).map(([key, handler]) => ({
      key: [key as KateTypes.InputKey],
      label: handler.label,
      allow_repeat: false,
      handler: async () => handler.action(),
      enabled: handler.enabled,
    }));
    return dynamic({
      on_attached: (canvas) => {
        this.ui.focus.register_scene_handlers(scene, handlers);
      },
      on_detached: (canvas) => {
        this.ui.focus.deregister_scene_handlers(scene, handlers);
      },
    });
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
            return this.class(`kate-ui-step-icon ${i === x ? "active" : ""}`, []);
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
    return this.h("span", { class: "kate-ui-meta-text" }, children);
  }

  mono_text(children: Widgetable[]) {
    return this.h("span", { class: "kate-ui-mono-text" }, children);
  }

  hspace(size: number) {
    return this.class("kate-ui-space", []).attr({ style: `width: ${size}rem` });
  }

  vspace(size: number) {
    return this.class("kate-ui-space", []).attr({
      style: `height: ${size}rem`,
    });
  }

  field(label: string, children: Widgetable[]) {
    return this.class("kate-ui-field", [
      this.h("label", { class: "kate-ui-field-label" }, [label]),
      this.class("kate-ui-field-content", children),
    ]);
  }

  text_input(initial_value: string, x: { query?: string; on_change?: (value: string) => void }) {
    const value = new Observable<string>(initial_value);
    return this.class("kate-ui-text-input", [
      this.dynamic(value as Observable<Widgetable>),
      this.fa_icon("pen"),
    ]).interactive([
      {
        key: ["o"],
        label: "Edit",
        on_click: true,
        handler: async () => {
          const new_value = await KateAPI.dialogs.text_input(x.query ?? "", {
            type: "text",
            initial_value: initial_value,
            max_length: 255,
          });
          if (new_value != null) {
            value.value = new_value;
            x.on_change?.(new_value);
          }
        },
      },
    ]);
  }

  stack(children: Widgetable[]) {
    return this.class(
      "kate-ui-stack",
      children.map((x) => this.class("kate-ui-stack-item", [x]))
    );
  }

  flow(children: Widgetable[]) {
    return this.class(
      "kate-ui-flow",
      children.map((x) => this.h("span", { class: "kate-ui-flow-item" }, [x]))
    );
  }

  strong(children: Widgetable[]) {
    return this.h("strong", { class: "kate-ui-strong" }, children);
  }

  ul(items: Widgetable[]) {
    return this.h(
      "ul",
      { class: "kate-ui-ul" },
      items.map((x) => this.h("li", { class: "kate-ui-li" }, [x]))
    );
  }

  vbox(options: { gap?: number; justify?: BoxJustify; align?: BoxAlign }, children: Widgetable[]) {
    return this.class("kate-ui-vbox", children).attr({
      style: style({
        gap: rem(options.gap),
        "justify-content": options.justify,
        "align-items": options.align,
      }),
    });
  }

  hbox(options: { gap?: number; justify?: BoxJustify; align?: BoxAlign }, children: Widgetable[]) {
    return this.class("kate-ui-hbox", children).attr({
      style: style({
        gap: rem(options.gap),
        "justify-content": options.justify,
        "align-items": options.align,
      }),
    });
  }

  centered(children: Widgetable[]) {
    return this.class("kate-ui-centered", children);
  }

  title(x: Widgetable[], level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" = "h1") {
    return this.h(level, { class: "kate-ui-title" }, x);
  }

  subtitle(x: Widgetable[], level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" = "h2") {
    return this.h(level, { class: "kate-ui-subtitle" }, x);
  }

  fa_icon(name: string, size: Size = "1x", style: IconStyle = "solid", animation?: IconAnimation) {
    const anim = animation == null ? "" : `fa-${animation}`;
    return this.h("i", { class: `fa-${style} fa-${size} fa-${name} ${anim}` }, []);
  }

  action_buttons(buttons: Widgetable[]) {
    return this.class("kate-ui-action-buttons", buttons);
  }

  scroll_area(x: { track_visible?: boolean }, children: Widgetable[]) {
    return this.class("kate-ui-scroll-area", children).style({
      "overflow-y": x.track_visible ? "scroll" : null,
    });
  }

  no_thumbnail(text: string = "") {
    return this.class("kate-ui-no-thumbnail", [this.class("kate-ui-no-thumbnail-title", [text])]);
  }

  cartridge_chip(x: {
    thumbnail_dataurl?: string | null;
    title: string;
    id: string;
    metadata?: { [key: string]: Widgetable };
  }) {
    return this.class("kate-ui-cartridge-chip", [
      this.class("kate-ui-cartridge-chip-thumbnail", [
        x.thumbnail_dataurl == null
          ? this.no_thumbnail()
          : this.h(
              "img",
              {
                src: x.thumbnail_dataurl,
                class: "kate-ui-cartridge-image-thumb",
              },
              []
            ),
      ]),
      this.class("kate-ui-cartridge-chip-info", [
        this.class("kate-ui-cartridge-chip-title", [x.title]),
        this.class("kate-ui-cartridge-chip-id", [x.id]),
        this.class("kate-ui-cartridge-chip-meta", [
          ...Object.entries(x.metadata ?? {}).map(([key, value]) => {
            return this.class("kate-ui-cartridge-chip-meta-field", [
              this.class("kate-ui-cartridge-chip-meta-label", [key, ":"]),
              this.class("kate-ui-cartridge-chip-meta-value", [value]),
            ]);
          }),
        ]),
      ]),
    ]);
  }

  cartridge_button(x: {
    thumbnail_dataurl?: string | null;
    title: string;
    id: string;
    release_type?: ReleaseType;
    content_rating?: ContentRating;
    on_select?: () => void;
    select_label?: string;
    on_menu?: () => void;
    menu_label?: string;
  }) {
    return this.class("kate-ui-cartridge-box", [
      this.class("kate-ui-cartridge-image", [
        // thumbnail
        x.thumbnail_dataurl
          ? this.h(
              "img",
              {
                src: x.thumbnail_dataurl,
                class: "kate-ui-cartridge-image-thumb",
              },
              []
            )
          : this.no_thumbnail(x.title),
        // release type
        this.class("kate-ui-cartridge-release-type", [
          pretty_release_type(x.release_type ?? null),
        ]).attr({ "data-release-type": x.release_type ?? null }),
        // content rating
        this.class("kate-ui-cartridge-rating", [rating_icon(x.content_rating ?? null)]).attr({
          "data-rating": x.content_rating ?? null,
        }),
      ]),
      this.class("kate-ui-cartridge-info", [
        this.class("kate-ui-cartridge-title", [x.title]),
        this.class("kate-ui-cartridge-id", [x.id]),
      ]),
    ]).interactive(
      compact<InteractionHandler>([
        x.on_select == null
          ? null
          : {
              key: ["o"],
              on_click: true,
              label: x.select_label ?? "Ok",
              handler: async () => x.on_select!(),
            },
        x.on_menu == null
          ? null
          : {
              key: ["menu"],
              on_menu: true,
              label: x.menu_label ?? "Options",
              handler: async () => x.on_menu!(),
            },
      ]),
      {
        custom_focus: true,
      }
    );
  }

  section(x: { title: Widgetable; body: Widgetable }) {
    return this.class("kate-ui-section", [
      this.class("kate-ui-section-title", [x.title]),
      this.class("kate-ui-section-body", [x.body]),
    ]);
  }

  toggle(x: {
    value: Observable<boolean>;
    enabled_label?: Widgetable;
    disabled_label?: Widgetable;
  }) {
    return this.class("kate-ui-toggle-container", [
      this.class("kate-ui-toggle-view", [this.class("kate-ui-toggle-bullet", [])]),
      this.class("kate-ui-toggle-label-yes", [x.enabled_label ?? "Yes"]),
      this.class("kate-ui-toggle-label-no", [x.disabled_label ?? "No"]),
    ]).dynamic(x.value, (widget, value) => {
      widget.canvas.classList.toggle("active", value);
    });
  }

  toggle_panel(x: {
    value: boolean | Observable<boolean>;
    title: Widgetable;
    description: Widgetable;
    enabled_label?: Widgetable;
    disabled_label?: Widgetable;
    tap?: (output: Observable<boolean>) => void;
  }) {
    const value =
      typeof x.value === "boolean" ? new Observable(x.value) : new Observable(x.value.value);
    x.tap?.(value);

    return this.class("kate-ui-toggle-panel", [
      this.class("kate-ui-toggle-panel-title", [x.title]),
      this.class("kate-ui-toggle-panel-description", [x.description]),
      this.class("kate-ui-toggle-panel-control", [
        this.toggle({
          value,
          enabled_label: x.enabled_label,
          disabled_label: x.disabled_label,
        }),
      ]),
    ]).interactive([
      {
        key: ["o"],
        label: "Toggle",
        on_click: true,
        handler: async () => {
          value.value = !value.value;
        },
      },
    ]);
  }
}

function style(items: { [key: string]: string | null | undefined }): string {
  return Object.entries(items)
    .filter(([_, x]) => x != null)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

function rem(x: number | null | undefined) {
  return x != null ? `${x}rem` : null;
}

function compact<A>(xs: (A | null)[]): A[] {
  return xs.filter((x) => x != null) as A[];
}

function pretty_release_type(x: ReleaseType | null) {
  switch (x) {
    case null:
      return null;
    case "beta":
      return "Beta";
    case "demo":
      return "Demo";
    case "early-access":
      return "Dev.";
    case "prototype":
      return "PoC";
    case "regular":
      return "Full";
    case "unofficial":
      return "Unofficial";
    default:
      throw unreachable(x, "release type");
  }
}

function rating_icon(x: ContentRating | null) {
  switch (x) {
    case null:
      return null;
    case "general":
      return "G";
    case "teen-and-up":
      return "T";
    case "mature":
      return "M";
    case "explicit":
      return "E";
    case "unknown":
      return "—";
    default:
      throw unreachable(x, "content rating");
  }
}

function key_to_button(x: KateTypes.InputKey): ButtonIcon {
  switch (x) {
    case "capture":
      return "capture";
    case "ltrigger":
      return "l";
    case "rtrigger":
      return "r";
    case "down":
      return "dpad-down";
    case "left":
      return "dpad-left";
    case "right":
      return "dpad-right";
    case "up":
      return "dpad-up";
    case "menu":
      return "menu";
    case "o":
      return "ok";
    case "x":
      return "cancel";
    case "sparkle":
      return "sparkle";
    case "berry":
      return "berry";
    default:
      throw unreachable(x);
  }
}
