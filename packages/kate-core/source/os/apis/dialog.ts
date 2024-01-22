/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { KateButton } from "../../kernel";
import { Deferred, Observable, defer } from "../../utils";
import type { KateOS } from "../os";
import { wait } from "../time";
import * as UI from "../ui";
import { Scene } from "../ui/scenes";

export class KateDialog {
  constructor(readonly os: KateOS) {}

  async message(id: string, x: { title: string; message: UI.Widgetable }) {
    const hud = new HUD_Dialog(this, "message", id);
    try {
      this.os.push_scene(hud);
      return await hud.show(
        id,
        x.title,
        x.message,
        [{ label: "Ok", kind: "primary", value: null }],
        null
      );
    } finally {
      this.os.pop_scene(hud);
    }
  }

  async confirm(
    id: string,
    x: {
      title: string;
      message: UI.Widgetable;
      ok?: string;
      cancel?: string;
      dangerous?: boolean;
    }
  ) {
    const hud = new HUD_Dialog(this, "confirm", id);
    try {
      this.os.push_scene(hud);
      return await hud.show(
        id,
        x.title,
        x.message,
        [
          { label: x.cancel ?? "Cancel", kind: "cancel", value: false },
          {
            label: x.ok ?? "Ok",
            kind: x.dangerous === true ? "dangerous" : "primary",
            value: true,
          },
        ],
        false
      );
    } finally {
      this.os.pop_scene(hud);
    }
  }

  async progress(id: string, message: UI.Widgetable, process: (_: Progress) => Promise<void>) {
    const hud = new HUD_Dialog(this, "progress", id);
    try {
      this.os.push_scene(hud);
      return await hud.progress(id, message, process);
    } finally {
      this.os.pop_scene(hud);
    }
  }

  async text_input(
    id: string,
    message: string,
    options: {
      min_length?: number;
      max_length?: number;
      initial_value?: string;
      type: "text" | "password";
      placeholder?: string;
      autocomplete?: UI.AutoComplete[];
    }
  ) {
    const value = new Observable(options.initial_value ?? "");
    const valid = value.map((x) => {
      if (options.min_length && x.length < options.min_length) {
        return `Must have at least ${options.min_length} character(s)`;
      }
      if (options.max_length && x.length > options.max_length) {
        return `Must have at most ${options.max_length} characters(s)`;
      }
      return null;
    });
    const input = UI.h(
      "input",
      {
        type: options.type,
        value: options.initial_value ?? "",
        placeholder: options.placeholder ?? "",
        autocomplete: options.autocomplete == null ? "" : options.autocomplete.join(" "),
        class: "kate-ui-text-input-input",
      },
      []
    ) as HTMLInputElement;
    const update = () => {
      if (value.value !== input.value) {
        value.value = input.value;
      }
    };
    input.addEventListener("keyup", update);
    input.addEventListener("change", update);
    input.addEventListener("keydown", (ev) => {
      if (ev.code === "ArrowUp" || ev.code === "ArrowDown") {
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

    const deferred = this.custom<string | null>(
      id,
      "kate-ui-text-input-container",
      [
        UI.h("div", { class: "kate-ui-text-input-message" }, [message]),
        UI.h("div", { class: "kate-ui-text-input-control" }, [
          UI.interactive(
            this.os,
            UI.h("form", {}, [
              input,
              UI.vspace(0.3),
              UI.klass("kate-ui-text-input-error", [
                UI.hbox(0.5, [
                  UI.meta_text([
                    UI.dynamic(value.map<UI.Widgetable>((x) => `${x.length} character(s)`)),
                  ]),
                  UI.dynamic(
                    valid.map((x) => (x == null ? null : ` | ${x}`)) as Observable<UI.Widgetable>
                  ),
                ]),
              ]),
            ]),
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
        ]),
        UI.h("div", { class: "kate-hud-dialog-actions" }, [
          UI.h("div", { class: "kate-hud-dialog-action", "data-kind": "cancel" }, [
            UI.button("Cancel", {
              on_clicked: () => {
                deferred.resolve(null);
              },
            }),
          ]),
          UI.h("div", { class: "kate-hud-dialog-action", "data-kind": "primary" }, [
            UI.button("Ok", {
              on_clicked: () => {
                deferred.resolve(input.value);
              },
            }),
          ]),
        ]),
        UI.h("div", { class: "kate-hud-virtual-keyboard-placeholder" }, []),
      ],
      null,
      "text-input"
    );
    return await deferred.promise;
  }

  custom<A>(
    id: string,
    className: string,
    contents: UI.Widgetable[],
    cancel_value: A,
    description: string = "custom"
  ): Deferred<A> {
    const hud = new HUD_Dialog(this, description, id);
    this.os.push_scene(hud);
    const deferred = hud.custom(id, `kate-hud-dialog-custom ${className}`, contents, cancel_value);
    deferred.promise.finally(() => {
      this.os.pop_scene(hud);
    });
    return deferred;
  }

  async pop_menu<A>(
    id: string,
    heading: string,
    buttons: { label: string; value: A }[],
    cancel_value: A
  ) {
    const hud = new HUD_Dialog(this, "pop-menu", id);
    try {
      this.os.push_scene(hud);
      return await hud.pop_menu(id, heading, buttons, cancel_value);
    } finally {
      this.os.pop_scene(hud);
    }
  }
}

export class Progress {
  readonly canvas: HTMLElement;
  constructor(private _message: UI.Widgetable) {
    this.canvas = document.createElement("div");
    this.canvas.append(this.render());
  }

  render() {
    return UI.h("div", { class: "kate-ui-progress-container" }, [
      UI.h("div", { class: "kate-ui-progress-message" }, [this._message]),
      UI.h("div", { class: "kate-ui-progress-indicator" }, [
        UI.fa_icon("circle-notch", "2x", "solid", "spin"),
      ]),
    ]);
  }

  set_message(message: string) {
    this._message = message;
    this.canvas.querySelector(".kate-ui-progress-message")!.textContent = message;
  }
}

export class HUD_Dialog extends Scene {
  readonly FADE_OUT_TIME_MS = 250;

  constructor(
    readonly manager: KateDialog,
    readonly description = "dialog",
    readonly application_id: string
  ) {
    super(manager.os, false);
    (this as any).canvas = UI.h("div", { class: "kate-hud-dialog", "data-title": description }, []);
  }

  render() {
    return null;
  }

  async progress(id: string, message: UI.Widgetable, process: (_: Progress) => Promise<void>) {
    const progress = new Progress(message);
    const element = UI.h("div", { class: "kate-hud-dialog-message" }, [progress.canvas]);
    try {
      const result = process(progress);
      this.canvas.textContent = "";
      this.canvas.appendChild(element);
      await result;
      setTimeout(async () => {
        element.classList.add("leaving");
        await wait(this.FADE_OUT_TIME_MS);
        element.remove();
      });
    } finally {
      this.os.kernel.console.body.classList.remove("trusted-mode");
      this.canvas.textContent = "";
    }
  }

  async show<A>(
    id: string,
    title: string,
    message: UI.Widgetable,
    buttons: {
      label: string;
      kind?: "primary" | "dangerous" | "cancel" | "button";
      value: A;
    }[],
    cancel_value: A
  ) {
    const result: Deferred<A> = this.custom(
      id,
      "kate-hud-dialog-message",
      [
        UI.h("div", { class: "kate-hud-dialog-title" }, [title]),
        UI.h("div", { class: "kate-hud-dialog-text" }, [message]),
        UI.h("div", { class: "kate-hud-dialog-actions" }, [
          ...buttons.map((x) => {
            return UI.h(
              "div",
              {
                class: "kate-hud-dialog-action",
                "data-kind": x.kind ?? "cancel",
              },
              [new UI.Button([x.label]).on_clicked(() => result.resolve(x.value))]
            );
          }),
        ]),
      ],
      cancel_value
    );
    return result.promise;
  }

  custom<A>(id: string, className: string, content: UI.Widgetable[], cancel_value: A) {
    const result = defer<A>();
    const dialog = UI.h("div", { class: `kate-hud-dialog-root ${className}` }, [
      UI.h("div", { class: "kate-hud-dialog-container" }, [...content]),
    ]);
    dialog.addEventListener("click", (ev) => {
      if (ev.target === dialog) {
        result.resolve(cancel_value);
      }
    });
    this.canvas.textContent = "";
    this.canvas.appendChild(dialog);
    const key_handler = (x: { key: KateButton; is_repeat: boolean }) => {
      if (x.key === "x" && !x.is_repeat) {
        result.resolve(cancel_value);
        return true;
      }
      return false;
    };
    this.os.focus_handler.listen(this.canvas, key_handler);
    result.promise.finally(() => {
      this.os.focus_handler.remove(this.canvas, key_handler);
      setTimeout(async () => {
        dialog.classList.add("leaving");
        await wait(this.FADE_OUT_TIME_MS);
        dialog.remove();
      });
    });
    return result;
  }

  async pop_menu<A>(
    id: string,
    heading: string,
    buttons: { label: string; value: A }[],
    cancel_value: A
  ) {
    const result: Deferred<A> = this.custom(
      id,
      "kate-hud-dialog-pop-menu",
      [
        UI.h("div", { class: "kate-hud-dialog-pop-menu-container" }, [
          UI.h("div", { class: "kate-hud-dialog-pop-menu-title" }, [heading]),
          UI.h("div", { class: "kate-hud-dialog-pop-menu-actions" }, [
            ...buttons.map((x) => {
              return UI.h(
                "div",
                {
                  class: "kate-hud-dialog-pop-menu-action",
                },
                [new UI.Button([x.label]).on_clicked(() => result.resolve(x.value))]
              );
            }),
          ]),
        ]),
      ],
      cancel_value
    );
    return result.promise;
  }
}
