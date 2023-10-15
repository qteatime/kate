/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventStream, Observable, defer, unreachable } from "./utils";
import { ActionItem, WidgetDSL, Widgetable, append, replace } from "./widget";

export class UI {
  private _current: UIScene | null = null;
  private _stack: UIScene[] = [];
  private _focus: UIFocus;
  private _dialogs: UIDialogs;

  readonly on_scene_changed = new EventStream<UIScene | null>();

  readonly dsl = new WidgetDSL(this);

  constructor(readonly root: HTMLElement, env: InputEnv) {
    this._focus = new UIFocus(this, env);
    this._dialogs = new UIDialogs(this);
  }

  get current() {
    return this._current;
  }

  get focus() {
    return this._focus;
  }

  get dialogs() {
    return this._dialogs;
  }

  get is_last_scene() {
    return this._stack.length === 0;
  }

  push_scene(scene: UIScene) {
    if (this._current != null) {
      const current = this._current;
      current.on_deactivated();
      this._stack.push(current);
    }
    this._current = scene;
    this.root.appendChild(scene.canvas);
    scene.on_attached();
    scene.on_activated();
    this.on_scene_changed.emit(scene);
  }

  pop_scene(scene: UIScene) {
    if (this._current !== scene) {
      throw new Error(`pop_scene(): unexpected scene`);
    }
    scene.on_deactivated();
    scene.on_detached();
    scene.canvas.remove();
    const next = this._stack.pop() ?? null;
    this._current = next;
    if (next != null) {
      next.on_activated();
    }
    this.on_scene_changed.emit(next);
  }

  replace_scene(expected: UIScene, scene: UIScene) {
    this.pop_scene(expected);
    this.push_scene(scene);
  }

  pop_current_scene() {
    if (this._current != null) {
      this.pop_scene(this._current);
    } else {
      throw new Error(`pop_current_scene(): no current scene`);
    }
  }
}

export class UIDialogs {
  constructor(readonly ui: UI) {}

  async message(x: { title?: Widgetable[]; message: Widgetable[]; events?: DialogEvents }) {
    const ui = this.ui;

    const deferred = defer<void>();
    const screen = new MessageDialog(
      ui,
      x.title ?? [],
      x.message,
      () => {
        deferred.resolve();
      },
      x.events
    );
    ui.push_scene(screen);
    deferred.promise.finally(() => ui.pop_scene(screen));
    return deferred.promise;
  }

  async confirm(x: {
    title?: Widgetable[];
    message: Widgetable[];
    confirm_label?: string;
    cancel_label?: string;
    dangerous?: boolean;
    events?: DialogEvents;
  }) {
    const ui = this.ui;

    const deferred = defer<boolean>();
    const screen = new ConfirmDialog(
      ui,
      x.title ?? [],
      x.message,
      {
        on_confirm: () => deferred.resolve(true),
        on_cancel: () => deferred.resolve(false),
        cancel_label: x.cancel_label,
        confirm_label: x.confirm_label,
        dangerous: x.dangerous,
      },
      x.events
    );
    ui.push_scene(screen);
    deferred.promise.finally(() => ui.pop_scene(screen));
    return deferred.promise;
  }

  async progress<A>(x: {
    title?: Widgetable[];
    message: Widgetable[];
    process: (_: ProgressHandler) => Promise<A>;
  }) {
    const ui = this.ui;

    const screen = new ProgressDialog(ui, x.title ?? [], x.message);
    ui.push_scene(screen);
    try {
      return await x.process(new ProgressHandler(screen));
    } finally {
      ui.pop_scene(screen);
    }
  }

  async pop_menu<A>(x: {
    title?: Widgetable[];
    cancel_label?: string;
    items: PopMenuItem<A>[];
    cancel_value: A;
  }): Promise<A> {
    const ui = this.ui;

    const deferred = defer<A>();
    const screen = new PopMenuDialog(ui, {
      title: x.title,
      cancel_label: x.cancel_label,
      on_cancel: () => deferred.resolve(x.cancel_value),
      items: x.items.map((a) => ({
        icon: a.icon,
        title: a.title,
        is_visible: a.is_visible,
        on_select: () => deferred.resolve(a.value),
      })),
    });
    ui.push_scene(screen);
    deferred.promise.finally(() => ui.pop_scene(screen));
    return deferred.promise;
  }
}

export class ProgressHandler {
  constructor(private _scene: ProgressDialog) {}

  set_message(message: Widgetable[]) {
    this._scene.set_message(message);
  }
}

export type PopMenuItem<A> = {
  icon?: Widgetable;
  title: Widgetable;
  value: A;
  is_visible?: boolean;
};

export abstract class UIScene {
  readonly canvas: HTMLElement;

  constructor(readonly ui: UI) {
    this.canvas = document.createElement("div");
    this.canvas.className = "kate-ui-scene";
  }

  abstract render(): Widgetable | Promise<Widgetable>;

  async refresh() {
    try {
      replace(this.canvas, this.ui.dsl.class("kate-ui-loading", ["Loading..."]));
      const body = await this.render();
      replace(this.canvas, body);
      this.ui.focus.ensure_focus();
    } catch (e) {
      replace(this.canvas, this.ui.dsl.class("kate-ui-error", ["Failed to render the screen"]));
    }
  }

  on_attached(): void {
    this.refresh();
  }
  on_detached(): void {}
  on_activated(): void {}
  on_deactivated(): void {}
}

export type InteractionHandler = {
  key: KateTypes.InputKey[];
  label: string;
  allow_repeat?: boolean;
  on_click?: boolean;
  on_menu?: boolean;
  enabled?: boolean;
  handler: (key: KateTypes.InputKey, repeat: boolean) => Promise<void>;
};

export type InputEnv = {
  on_key_pressed: EventStream<{
    key: KateTypes.InputKey;
    is_repeat: boolean;
    is_long_press: boolean;
  }>;
};

export class UIFocus {
  private _interactive = new WeakMap<HTMLElement, InteractionHandler[]>();
  private _scene_handlers = new WeakMap<UIScene, InteractionHandler[]>();

  readonly on_focus_changed = new EventStream<HTMLElement | null>();
  readonly on_handlers_changed = new EventStream<{
    focus: InteractionHandler[];
    scene: InteractionHandler[];
  }>();

  constructor(readonly ui: UI, readonly env: InputEnv) {
    this.ui.on_scene_changed.listen(this.handle_scene_changed);
    env.on_key_pressed.listen((x) => this.handle_key(x.key, x.is_repeat));
  }

  get root() {
    return this.ui.current?.canvas ?? null;
  }

  get current() {
    const root = this.root;
    if (root == null) {
      return null;
    } else {
      return (root.querySelector(".focus") ?? null) as HTMLElement | null;
    }
  }

  get current_interactions() {
    const current = this.current;
    if (current != null) {
      return (this._interactive.get(current) ?? []).filter((x) => x.enabled ?? true);
    } else {
      return [];
    }
  }

  get scene_interactions() {
    const current = this.ui.current;
    if (current != null) {
      return (this._scene_handlers.get(current) ?? []).filter((x) => x.enabled ?? true);
    } else {
      return [];
    }
  }

  register_interactions(element: HTMLElement, interactions: InteractionHandler[]) {
    this._interactive.set(element, interactions);
    this.on_handlers_changed.emit({
      focus: this.current_interactions,
      scene: this.scene_interactions,
    });
  }

  register_scene_handlers(scene: UIScene, interactions: InteractionHandler[]) {
    const handlers0 = this._scene_handlers.get(scene) ?? [];
    const handlers = handlers0.concat(interactions.filter((x) => !handlers0.includes(x)));
    this._scene_handlers.set(scene, handlers);
    this.on_handlers_changed.emit({
      focus: this.current_interactions,
      scene: this.scene_interactions,
    });
  }

  deregister_scene_handlers(scene: UIScene, interactions: InteractionHandler[]) {
    const handlers0 = this._scene_handlers.get(scene) ?? [];
    const handlers = handlers0.filter((x) => !interactions.includes(x));
    this._scene_handlers.set(scene, handlers);
    this.on_handlers_changed.emit({
      focus: this.current_interactions,
      scene: this.scene_interactions,
    });
  }

  focus(element: HTMLElement | null) {
    const root = this.root;
    if (root == null) {
      return;
    }

    const focused = Array.from(root.querySelectorAll(".focus"));
    for (const item of focused) {
      item.classList.toggle("focus", item === element);
    }
    if (element != null) {
      element.classList.add("focus");
      this.scroll_into_view(element);
    }
    this.on_focus_changed.emit(element);
    this.on_handlers_changed.emit({
      focus: this.current_interactions,
      scene: this.scene_interactions,
    });
  }

  ensure_focus() {
    const root = this.root;
    if (root == null) {
      return;
    }

    const current_focus =
      root.querySelector(".focus") ?? root.querySelector(".kate-ui-focus-target") ?? null;

    if (current_focus instanceof HTMLElement || current_focus == null) {
      this.focus(current_focus);
    }
  }

  handle_key = (key: KateTypes.InputKey, repeat: boolean) => {
    const current = this.current;
    if (current != null) {
      if (this.handle_current_interaction(current, key, repeat)) {
        return;
      }
    }
    if (this.handle_scene_interaction(key, repeat)) {
      return;
    }

    if (key === "up" || key === "right" || key === "down" || key === "left") {
      this.handle_focus_change(key);
    }
  };

  handle_focus_change(direction: "up" | "left" | "down" | "right") {
    const root = this.root;
    if (root == null) {
      return;
    }
    const current = this.current;
    const bounds = current?.getBoundingClientRect() ?? {
      left: 0,
      top: 0,
      right: 2 ** 32,
      bottom: 2 ** 32,
    };
    const focusable = Array.from(root.querySelectorAll(".kate-ui-focus-target"))
      .map((x) => ({
        element: x as HTMLElement,
        bounds: x.getBoundingClientRect(),
      }))
      .filter((x) => x.element !== current);

    function vertical_distance(x: DOMRect) {
      if (x.top > bounds.bottom) {
        return x.top - bounds.bottom;
      } else if (x.bottom < bounds.top) {
        return x.bottom - bounds.top;
      } else {
        return 0;
      }
    }

    function horizontal_distance(x: DOMRect) {
      if (x.left > bounds.right) {
        return x.left - bounds.right;
      } else if (x.right < bounds.left) {
        return x.right - bounds.left;
      } else {
        return 0;
      }
    }

    function overlap([a, b]: [number, number], [x, y]: [number, number]) {
      if (b < x || b > y) {
        return false;
      } else {
        return true;
      }
    }

    function horizontal_penalty(x: DOMRect) {
      if (overlap([x.left, x.right], [bounds.left, bounds.right])) {
        return 0;
      } else {
        const distance = Math.min(Math.abs(x.right - bounds.left), Math.abs(x.left - bounds.right));
        return distance + 1_000_000;
      }
    }

    function vertical_penalty(x: DOMRect) {
      if (overlap([x.top, x.bottom], [bounds.top, bounds.bottom])) {
        return 0;
      } else {
        const distance = Math.min(Math.abs(x.bottom - bounds.top), Math.abs(x.top - bounds.bottom));
        return distance + 1_000_000;
      }
    }

    function vx(x: DOMRect) {
      return vertical_distance(x) + horizontal_penalty(x);
    }

    function hx(x: DOMRect) {
      return horizontal_distance(x) + vertical_penalty(x);
    }

    let new_focus: HTMLElement | null = null;
    switch (direction) {
      case "left": {
        const candidates = focusable
          .filter((x) => current == null || x.bounds.right <= bounds.left)
          .sort((a, b) => hx(b.bounds) - hx(a.bounds));
        new_focus = candidates[0]?.element ?? null;
        break;
      }

      case "right": {
        const candidates = focusable
          .filter((x) => current == null || x.bounds.left >= bounds.right)
          .sort((a, b) => hx(a.bounds) - hx(b.bounds));
        new_focus = candidates[0]?.element ?? null;
        break;
      }

      case "up": {
        const candidates = focusable
          .filter((x) => current == null || x.bounds.bottom <= bounds.top)
          .sort((a, b) => vx(b.bounds) - vx(a.bounds));
        new_focus = candidates[0]?.element ?? null;
        break;
      }

      case "down": {
        const candidates = focusable
          .filter((x) => current == null || x.bounds.top >= bounds.bottom)
          .sort((a, b) => vx(a.bounds) - vx(b.bounds));
        new_focus = candidates[0]?.element ?? null;
        break;
      }
    }

    if (new_focus != null) {
      this.focus(new_focus);
    }
  }

  handle_current_interaction(current: HTMLElement, key: KateTypes.InputKey, repeat: boolean) {
    const interactions = this.current_interactions;
    const interaction = interactions.find(
      (x) => x.key.includes(key) && (x.allow_repeat || !repeat)
    );
    if (interaction == null) {
      return false;
    } else {
      interaction.handler(key, repeat);
      return true;
    }
  }

  handle_scene_interaction(key: KateTypes.InputKey, repeat: boolean) {
    if (this.ui.current == null) {
      return;
    }
    const scene_keys = this.scene_interactions;
    const scene_key = scene_keys.find((x) => x.key.includes(key) && (x.allow_repeat || !repeat));
    if (scene_key == null) {
      return false;
    } else {
      scene_key?.handler(key, repeat);
      return true;
    }
  }

  handle_scene_changed = () => {
    this.ensure_focus();
  };

  private scroll_into_view(element: HTMLElement) {
    let origin = { x: element.offsetLeft, y: element.offsetTop };
    let current = element.offsetParent as HTMLElement;
    while (current != null) {
      if (current.classList.contains("kate-ui-scroll-area")) {
        current.scrollTo({
          left: origin.x - current.clientWidth / 2 + element.offsetWidth / 2,
          top: origin.y - current.clientHeight / 2 + element.offsetHeight / 2,
        });
        break;
      } else {
        origin.x += current.offsetLeft;
        origin.y += current.offsetTop;
        current = current.offsetParent as HTMLElement;
      }
    }
  }
}

type DialogEvents = {
  on_shown?: () => void;
  on_hidden?: () => void;
};

export abstract class BaseDialog extends UIScene {
  constructor(ui: UI) {
    super(ui);
    this.canvas.classList.add("kate-ui-translucent");
  }
}

export class MessageDialog extends BaseDialog {
  constructor(
    ui: UI,
    readonly title: Widgetable[],
    readonly message: Widgetable[],
    readonly on_action: () => void,
    readonly events: DialogEvents = {}
  ) {
    super(ui);
  }

  render(): Widgetable {
    const ui = this.ui.dsl;

    return ui.class("kate-ui-dialog-root", [
      ui.class("kate-ui-dialog-container kate-ui-dialog-message-box", [
        ui.class("kate-ui-dialog-title", [...this.title]),
        ui.class("kate-ui-dialog-message", [...this.message]),
        ui.class("kate-ui-dialog-actions", [ui.text_button("Ok", () => this.on_action())]),
      ]),
      ui.keymap(this, {
        x: {
          label: "Cancel",
          action: () => this.on_action(),
        },
      }),
    ]);
  }

  override on_activated(): void {
    super.on_activated();
    this.events.on_shown?.();
  }

  override on_deactivated(): void {
    this.events.on_hidden?.();
    super.on_deactivated();
  }
}

export class ConfirmDialog extends BaseDialog {
  constructor(
    ui: UI,
    readonly title: Widgetable[],
    readonly message: Widgetable[],
    readonly options: {
      on_confirm: () => void;
      on_cancel: () => void;
      dangerous?: boolean;
      confirm_label?: string;
      cancel_label?: string;
    },
    readonly events: DialogEvents = {}
  ) {
    super(ui);
  }

  render(): Widgetable {
    const ui = this.ui.dsl;

    return ui.class("kate-ui-dialog-root", [
      ui.class("kate-ui-dialog-container kate-ui-dialog-confirm", [
        ui.class("kate-ui-dialog-title", [...this.title]),
        ui.class("kate-ui-dialog-message", [...this.message]),
        ui
          .class("kate-ui-dialog-actions", [
            ui.text_button(this.options.cancel_label ?? "Cancel", () => this.options.on_cancel()),
            ui.text_button(this.options.confirm_label ?? "Ok", () => this.options.on_confirm()),
          ])
          .attr({ "data-dangerous": this.options.dangerous ?? false }),
      ]),
      ui.keymap(this, {
        x: {
          label: this.options.cancel_label ?? "Cancel",
          action: () => this.options.on_cancel(),
        },
      }),
    ]);
  }

  override on_activated(): void {
    super.on_activated();
    this.events.on_shown?.();
  }

  override on_deactivated(): void {
    this.events.on_hidden?.();
    super.on_deactivated();
  }
}

export class ProgressDialog extends BaseDialog {
  private _message: Observable<Widgetable>;

  constructor(ui: UI, readonly title: Widgetable[], message: Widgetable[]) {
    super(ui);
    this._message = new Observable<Widgetable>(ui.dsl.fragment(message));
  }

  render() {
    const ui = this.ui.dsl;

    return ui.class("kate-ui-dialog-root", [
      ui.class("kate-ui-dialog-container kate-ui-dialog-progress", [
        ui.class("kate-ui-dialog-title", [...this.title]),
        ui.class("kate-ui-dialog-message", [ui.dynamic(this._message)]),
        ui.class("kate-ui-dialog-progress-indicator", [
          ui.fa_icon("circle-notch", "2x", "solid", "spin"),
        ]),
      ]),
    ]);
  }

  set_message(message: Widgetable[]) {
    this._message.value = this.ui.dsl.fragment(message);
  }
}

export class PopMenuDialog extends BaseDialog {
  constructor(
    ui: UI,
    readonly options: {
      title?: Widgetable[];
      items: ActionItem[];
      cancel_label?: string;
      on_cancel: () => void;
    }
  ) {
    super(ui);
  }

  render(): Widgetable {
    const ui = this.ui.dsl;

    return ui.class("kate-ui-dialog-absolute-root", [
      ui.class("kate-ui-dialog-pop-menu", [
        ui.class("kate-ui-dialog-title", this.options.title ?? []),
        ui.class("kate-ui-dialog-pop-menu-items", [ui.menu_list(this.options.items)]),
      ]),
      ui.keymap(this, {
        x: {
          label: this.options.cancel_label ?? "Cancel",
          action: () => this.options.on_cancel(),
        },
      }),
    ]);
  }
}
