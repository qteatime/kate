import { Deferred, defer } from "../../utils";
import type { ExtendedInputKey } from "../../kernel";
import type { KateOS } from "../os";
import { wait } from "../time";
import * as UI from "../ui";
import { Scene } from "../ui/scenes";

export class KateDialog {
  readonly hud: HUD_Dialog;
  constructor(readonly os: KateOS) {
    this.hud = new HUD_Dialog(this);
  }

  setup() {
    this.hud.setup();
  }

  async message(id: string, x: { title: string; message: string }) {
    return await this.hud.show(
      id,
      x.title,
      x.message,
      [{ label: "Ok", kind: "primary", value: null }],
      null
    );
  }

  async confirm(
    id: string,
    x: {
      title: string;
      message: string;
      ok?: string;
      cancel?: string;
      dangerous?: boolean;
    }
  ) {
    return await this.hud.show(
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
  }

  async progress(
    id: string,
    message: string,
    process: (_: Progress) => Promise<void>
  ) {
    return await this.hud.progress(id, message, process);
  }

  custom<A>(
    id: string,
    className: string,
    contents: UI.Widgetable[],
    cancel_value: A
  ): Deferred<A> {
    return this.hud.custom(
      id,
      `kate-hud-dialog-custom ${className}`,
      contents,
      cancel_value
    );
  }

  async pop_menu<A>(
    id: string,
    heading: string,
    buttons: { label: string; value: A }[],
    cancel_value: A
  ) {
    return await this.hud.pop_menu(id, heading, buttons, cancel_value);
  }
}

export class Progress {
  readonly canvas: HTMLElement;
  constructor(private _message: string) {
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
    this.canvas.querySelector(".kate-ui-progress-message")!.textContent =
      message;
  }
}

export class HUD_Dialog extends Scene {
  readonly FADE_OUT_TIME_MS = 250;

  constructor(readonly manager: KateDialog) {
    super(manager.os, false);
    (this as any).canvas = UI.h("div", { class: "kate-hud-dialog" }, []);
  }

  setup() {
    this.manager.os.show_hud(this);
  }

  teardown() {
    this.manager.os.hide_hud(this);
  }

  render() {
    return null;
  }

  is_trusted(id: string) {
    return id.startsWith("kate:");
  }

  async progress(
    id: string,
    message: string,
    process: (_: Progress) => Promise<void>
  ) {
    const progress = new Progress(message);
    const element = UI.h(
      "div",
      {
        class: "kate-hud-dialog-message",
        "data-trusted": String(this.is_trusted(id)),
      },
      [progress.canvas]
    );
    const result = process(progress);
    this.canvas.textContent = "";
    this.canvas.appendChild(element);
    this.os.focus_handler.push_root(this.canvas);
    try {
      await result;
    } finally {
      this.os.focus_handler.pop_root(this.canvas);
      setTimeout(async () => {
        element.classList.add("leaving");
        await wait(this.FADE_OUT_TIME_MS);
        element.remove();
      });
      this.os.kernel.console.body.classList.remove("trusted-mode");
      this.canvas.textContent = "";
    }
  }

  async show<A>(
    id: string,
    title: string,
    message: string,
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
              [
                new UI.Button([x.label]).on_clicked(() =>
                  result.resolve(x.value)
                ),
              ]
            );
          }),
        ]),
      ],
      cancel_value
    );
    return result.promise;
  }

  custom<A>(
    id: string,
    className: string,
    content: UI.Widgetable[],
    cancel_value: A
  ) {
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
      const key_handler = (x: {
        key: ExtendedInputKey;
        is_repeat: boolean;
      }) => {
        if (x.key === "x" && !x.is_repeat) {
          result.resolve(cancel_value);
          return true;
        }
        return false;
      };
      this.os.focus_handler.push_root(this.canvas);
      this.os.focus_handler.listen(this.canvas, key_handler);
      result.promise.finally(() => {
        this.os.kernel.exit_trusted_mode();
        this.os.focus_handler.pop_root(this.canvas);
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
                [
                  new UI.Button([x.label]).on_clicked(() =>
                    result.resolve(x.value)
                  ),
                ]
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
