/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { InputKey } from "../../kernel";
import { EventStream, Sets, serialise_error } from "../../utils";
import { FocusInteraction } from "../apis";
import type { KateOS } from "../os";
import {
  h,
  append,
  Widgetable,
  simple_screen,
  scroll,
  icon_button,
  stringify,
  to_node,
  fa_icon,
} from "./widget";

export abstract class Scene {
  readonly canvas: HTMLElement;
  constructor(protected os: KateOS, upscaled: boolean) {
    this.canvas = h("div", { class: `kate-os-screen ${upscaled ? "upscaled" : ""}` }, []);
  }

  async attach(to: HTMLElement) {
    to.appendChild(this.canvas);
    this.canvas.innerHTML = "";
    append(this.render(), this.canvas);
    this.on_attached();
  }

  async detach() {
    this.canvas.remove();
    this.on_detached();
  }

  abstract render(): Widgetable;

  on_attached() {}
  on_detached() {}

  close() {
    this.os.pop_scene(this);
  }
}

export type Action = {
  key: InputKey[];
  label: string;
  handler: (key: InputKey, is_repeat: boolean, is_long_press: boolean) => void;
};

export abstract class SimpleScene extends Scene {
  abstract icon: string;
  abstract title: Widgetable[];
  subtitle: Widgetable | null = null;
  abstract body(): Widgetable[] | Promise<Widgetable[]>;
  readonly actions: Action[] = [
    {
      key: ["x"],
      label: "Return",
      handler: () => this.on_return(),
    },
  ];
  private _previous_traps: FocusInteraction | null = null;
  public on_close = new EventStream<void>();

  constructor(os: KateOS) {
    super(os, true);
  }

  on_return = () => {
    this.close();
  };

  render() {
    const body = this.body();
    const body_element =
      body instanceof Promise
        ? [
            h("div", { class: "kate-ui-screen-loading-indicator" }, [
              fa_icon("circle-notch", "2x", "solid", "spin"),
              "Loading...",
            ]),
          ]
        : body;
    const canvas = simple_screen({
      icon: this.icon,
      title: this.title,
      subtitle: this.subtitle,
      body: this.body_container(body_element),
      status: [...this.actions.map((x) => this.render_action(x))],
    });

    if (body instanceof Promise) {
      const container = body_element[0] as HTMLElement;
      body.then(
        (els) => {
          container.replaceWith(...els.map((x) => to_node(x)));
        },
        (error) => {
          console.error(`(Error rendering screen)`, error);
          this.os.audit_supervisor.log("kate:ui", {
            resources: ["kate:ui", "error"],
            risk: "high",
            type: "kate.ui.rendering.error",
            message: `Error rendering screen`,
            extra: { error: serialise_error(error) },
          });
          container.replaceWith(`(Error rendering screen)`);
        }
      );
    }

    return canvas;
  }

  body_container(body: Widgetable[]) {
    return scroll([h("div", { class: "kate-os-content kate-os-screen-body" }, body)]);
  }

  replace_body(content: Widgetable[]) {
    const body = this.canvas.querySelector(".kate-os-screen-body");
    if (body != null) {
      body.textContent = "";
      for (const child of content) {
        append(child, body);
      }
    }
  }

  async refresh() {
    const body = (async () => this.body())();
    this.replace_body(
      await body.catch(async (e) => {
        console.error("Error rendering screen:", e);
        this.os.audit_supervisor.log("kate:ui", {
          resources: ["kate:ui", "error"],
          risk: "high",
          type: "kate.ui.rendering.error",
          message: `Error rendering screen`,
          extra: { error: serialise_error(e) },
        });
        return ["Error rendering screen"];
      })
    );
  }

  render_action(action: Action) {
    return icon_button(action.key, action.label).on_clicked(() =>
      action.handler(action.key[0], false, false)
    );
  }

  on_attached(): void {
    this.canvas.setAttribute("data-title", stringify(this.title));
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    this.os.focus_handler.on_traps_changed.listen(this.update_status_with_traps);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
    this.os.focus_handler.on_traps_changed.remove(this.update_status_with_traps);
    this.on_close.emit();
  }

  update_status_with_traps = (traps: FocusInteraction | null) => {
    if (this._previous_traps == null && traps == null) {
      return;
    }

    const handlers = traps?.handlers ?? [];
    if (this._previous_traps != null) {
      const new_keys = new Set(handlers.map((x) => `${x.key.join(",")}:${x.label}`));
      const old_keys = new Set(
        this._previous_traps.handlers.map((x) => `${x.key.join(" ")}:${x.label}`)
      );
      if (Sets.same_set(new_keys, old_keys)) {
        return;
      }
    }
    this._previous_traps = traps;

    const status = this.canvas.querySelector(".kate-os-statusbar") ?? null;
    if (status != null) {
      status.textContent = "";
      for (const action of this.actions) {
        append(this.render_action(action), status);
      }
      for (const handler of handlers) {
        append(
          icon_button(handler.key, handler.label).on_clicked(() => {
            handler.handler(handler.key[0], false);
          }),
          status
        );
      }
    }
  };

  handle_key_pressed = (x: { key: InputKey; is_repeat: boolean; is_long_press: boolean }) => {
    if (x.is_repeat) {
      return false;
    }

    const handler = this.actions.find((h) => h.key.includes(x.key as InputKey));
    if (handler != null) {
      handler.handler(x.key as InputKey, x.is_repeat, x.is_long_press);
      return true;
    }
    return false;
  };
}
