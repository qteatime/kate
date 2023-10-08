/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { KateButton } from "../../kernel";
import { Deferred, defer } from "../../utils";
import type { KateOS } from "../os";
import { wait } from "../time";
import * as UI from "../ui";
import { Scene } from "../ui/scenes";

export class KateDialog {
  constructor(readonly os: KateOS) {}

  async message(id: string, x: { title: string; message: UI.Widgetable }) {
    const hud = new HUD_Dialog(this, "message");
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
    const hud = new HUD_Dialog(this, "confirm");
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
    const hud = new HUD_Dialog(this, "progress");
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
      max_length?: number;
      initial_value?: string;
      type: "text" | "password";
      placeholder?: string;
    }
  ) {
    const input = UI.h(
      "input",
      {
        type: options.type,
        value: options.initial_value ?? "",
        placeholder: options.placeholder ?? "",
        class: "kate-ui-text-input-input",
      },
      []
    ) as HTMLInputElement;
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
    const hud = new HUD_Dialog(this, description);
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
    const hud = new HUD_Dialog(this, "pop-menu");
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

  constructor(readonly manager: KateDialog, readonly description = "dialog") {
    super(manager.os, false);
    (this as any).canvas = UI.h("div", { class: "kate-hud-dialog", "data-title": description }, []);
  }

  render() {
    return null;
  }

  is_trusted(id: string) {
    return id.startsWith("kate:");
  }

  async progress(id: string, message: UI.Widgetable, process: (_: Progress) => Promise<void>) {
    const progress = new Progress(message);
    const element = UI.h(
      "div",
      {
        class: "kate-hud-dialog-message",
        "data-trusted": String(this.is_trusted(id)),
      },
      [progress.canvas]
    );
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
    const dialog = UI.h(
      "div",
      {
        class: `kate-hud-dialog-root ${className}`,
        "data-trusted": String(this.is_trusted(id)),
      },
      [UI.h("div", { class: "kate-hud-dialog-container" }, [...content])]
    );
    dialog.addEventListener("click", (ev) => {
      if (ev.target === dialog) {
        result.resolve(cancel_value);
      }
    });
    if (this.is_trusted(id)) {
      this.os.kernel.enter_trusted_mode();
    }
    try {
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
        this.os.kernel.exit_trusted_mode();
        this.os.focus_handler.remove(this.canvas, key_handler);
        setTimeout(async () => {
          dialog.classList.add("leaving");
          await wait(this.FADE_OUT_TIME_MS);
          dialog.remove();
        });
      });
    } catch (_) {
      this.os.kernel.exit_trusted_mode();
    }
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
