import { defer } from "../../../../util/build/promise";
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
    return await this.hud.show(id, x.title, x.message, [
      { label: "Ok", kind: "primary", value: null },
    ]);
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
    return await this.hud.show(id, x.title, x.message, [
      { label: x.cancel ?? "Cancel", kind: "cancel", value: false },
      {
        label: x.ok ?? "Ok",
        kind: x.dangerous === true ? "dangerous" : "primary",
        value: true,
      },
    ]);
  }

  async pop_menu<A>(
    id: string,
    heading: string,
    buttons: { label: string; value: A }[]
  ) {
    return await this.hud.pop_menu(id, heading, buttons);
  }
}

export class HUD_Dialog extends Scene {
  readonly FADE_OUT_TIME_MS = 250;

  constructor(readonly manager: KateDialog) {
    super(manager.os);
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

  async show<A>(
    id: string,
    title: string,
    message: string,
    buttons: {
      label: string;
      kind?: "primary" | "dangerous" | "cancel" | "button";
      value: A;
    }[]
  ) {
    const result = defer<A>();
    const element = UI.h(
      "div",
      {
        class: "kate-hud-dialog-message",
        "data-trusted": String(this.is_trusted(id)),
      },
      [
        UI.h("div", { class: "kate-hud-dialog-container" }, [
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
        ]),
      ]
    );

    let return_value;
    if (this.is_trusted(id)) {
      this.os.kernel.console.body.classList.add("trusted-mode");
    }
    try {
      this.canvas.textContent = "";
      this.canvas.appendChild(element);
      this.os.focus_handler.push_root(this.canvas);
      return_value = await result.promise;
      this.os.focus_handler.pop_root(this.canvas);
      setTimeout(async () => {
        element.classList.add("leaving");
        await wait(this.FADE_OUT_TIME_MS);
        element.remove();
      });
    } finally {
      this.os.kernel.console.body.classList.remove("trusted-mode");
    }
    return return_value;
  }

  async pop_menu<A>(
    id: string,
    heading: string,
    buttons: { label: string; value: A }[]
  ) {
    const result = defer<A>();
    const element = UI.h(
      "div",
      {
        class: "kate-hud-dialog-pop-menu",
        "data-trusted": String(this.is_trusted(id)),
      },
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
      ]
    );

    let return_value;
    if (this.is_trusted(id)) {
      this.os.kernel.console.body.classList.add("trusted-mode");
    }
    try {
      this.canvas.textContent = "";
      this.canvas.appendChild(element);
      this.os.focus_handler.push_root(this.canvas);
      return_value = await result.promise;
      this.os.focus_handler.pop_root(this.canvas);
      setTimeout(async () => {
        element.classList.add("leaving");
        await wait(this.FADE_OUT_TIME_MS);
        element.remove();
      });
    } finally {
      this.os.kernel.console.body.classList.remove("trusted-mode");
    }
    return return_value;
  }
}
