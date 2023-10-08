/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EventStream } from "./utils";
import { WidgetDSL, Widgetable, append, replace } from "./widget";

export class UI {
  private _current: UIScene | null = null;
  private _stack: UIScene[] = [];
  private _focus: UIFocus;

  readonly on_scene_changed = new EventStream<UIScene | null>();

  readonly dsl = new WidgetDSL(this);

  constructor(readonly root: HTMLElement) {
    this._focus = new UIFocus(this);
  }

  get current() {
    return this._current;
  }

  get focus() {
    return this._focus;
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

export abstract class UIScene {
  readonly canvas: HTMLElement;

  constructor(readonly ui: UI) {
    this.canvas = document.createElement("div");
    this.canvas.className = "kate-ui-scene";
  }

  abstract render(): Widgetable;

  on_attached(): void {
    replace(this.canvas, this.render());
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
  handler: (key: KateTypes.InputKey, repeat: boolean) => Promise<void>;
};

export class UIFocus {
  private _interactive = new WeakMap<HTMLElement, InteractionHandler[]>();
  private _scene_handlers = new WeakMap<UIScene, InteractionHandler[]>();

  readonly on_focus_changed = new EventStream<HTMLElement | null>();

  constructor(readonly ui: UI) {
    this.ui.on_scene_changed.listen(this.handle_scene_changed);
    KateAPI.input.on_key_pressed.listen((ev) => this.handle_key(ev.key, ev.is_repeat));
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
      return this._interactive.get(current) ?? [];
    } else {
      return [];
    }
  }

  register_interactions(element: HTMLElement, interactions: InteractionHandler[]) {
    this._interactive.set(element, interactions);
  }

  register_scene_handlers(scene: UIScene, interactions: InteractionHandler[]) {
    const handlers0 = this._scene_handlers.get(scene) ?? [];
    const handlers = handlers0.concat(interactions.filter((x) => !handlers0.includes(x)));
    this._scene_handlers.set(scene, handlers);
  }

  deregister_scene_handlers(scene: UIScene, interactions: InteractionHandler[]) {
    const handlers0 = this._scene_handlers.get(scene) ?? [];
    const handlers = handlers0.filter((x) => !interactions.includes(x));
    this._scene_handlers.set(scene, handlers);
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
      element.scrollIntoView({ block: "center", inline: "center" });
    }
    this.on_focus_changed.emit(element);
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

    let new_focus: HTMLElement | null = null;
    switch (direction) {
      case "left": {
        const candidates = focusable
          .filter((x) => x.bounds.right <= bounds.right)
          .sort(
            (a, b) =>
              a.bounds.right - b.bounds.right ||
              vertical_distance(a.bounds) - vertical_distance(b.bounds)
          );
        new_focus = candidates[0]?.element ?? null;
        break;
      }

      case "right": {
        const candidates = focusable
          .filter((x) => x.bounds.left >= bounds.left)
          .sort(
            (a, b) =>
              a.bounds.left - b.bounds.left ||
              vertical_distance(a.bounds) - vertical_distance(b.bounds)
          );
        new_focus = candidates[0]?.element ?? null;
        break;
      }

      case "up": {
        const candidates = focusable
          .filter((x) => x.bounds.bottom <= bounds.bottom)
          .sort(
            (a, b) =>
              a.bounds.bottom - b.bounds.bottom ||
              horizontal_distance(a.bounds) - horizontal_distance(b.bounds)
          );
        new_focus = candidates[0]?.element ?? null;
        break;
      }

      case "down": {
        const candidates = focusable
          .filter((x) => x.bounds.top >= bounds.top)
          .sort(
            (a, b) =>
              a.bounds.top - b.bounds.top ||
              horizontal_distance(a.bounds) - horizontal_distance(b.bounds)
          );
        new_focus = candidates[0]?.element ?? null;
        break;
      }
    }

    if (new_focus != null) {
      this.focus(new_focus);
    }
  }

  handle_current_interaction(current: HTMLElement, key: KateTypes.InputKey, repeat: boolean) {
    const interactions = this._interactive.get(current);
    if (interactions == null) {
      return false;
    }
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
    const scene_keys = this._scene_handlers.get(this.ui.current);
    if (scene_keys == null) {
      return false;
    }
    const scene_key = scene_keys?.find((x) => x.key.includes(key) && (x.allow_repeat || !repeat));
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
}
