/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as UI from "../../ui";
import type { KateOS } from "../../os";
import { KeyboardToKate, SettingsData } from "../../apis/settings";
import { Deferred, Observable, defer } from "../../../utils";
import { ButtonChangeEvent, KateButton } from "../../../kernel";

export class KeyboardInputSettings extends UI.SimpleScene {
  icon = "keyboard";
  title = ["Keyboard mapping"];

  private _mapping: KeyboardToKate[];
  private _changed = new Observable<boolean>(false);
  private _wait_key = new Observable<null | Deferred<string | null>>(null);

  constructor(os: KateOS) {
    super(os);
    this._mapping = os.settings.get("input").keyboard_mapping;
  }

  on_return = async () => {
    if (this._wait_key.value != null) {
      return;
    } else if (this._changed.value) {
      const discard_confirm = await this.os.dialog.confirm("kate:settings", {
        title: "Discard changes?",
        message:
          "The changes made to the keyboard mapping have not been saved. Discard changes and leave the screen?",
        cancel: "Review changes",
        ok: "Discard changes",
        dangerous: true,
      });
      if (discard_confirm) {
        this.close();
      }
    } else {
      this.close();
    }
  };

  body_container(body: UI.Widgetable[]): HTMLElement {
    return UI.h("div", { class: "kate-keyboard-mapping kate-os-content kate-os-screen-body" }, [
      ...body,
    ]);
  }

  body() {
    return [
      UI.h("div", { class: "kate-keyboard-mapping-main" }, [
        UI.h("div", { class: "kate-keyboard-mapping-left" }, [
          this.keymap("ltrigger"),
          this.keymap("capture"),
          this.keymap("up"),
          this.keymap("left"),
          this.keymap("right"),
          this.keymap("down"),
        ]),
        UI.h("div", { class: "kate-keyboard-mapping-right" }, [
          this.keymap("rtrigger"),
          this.keymap("menu"),
          this.keymap("o"),
          this.keymap("sparkle"),
          this.keymap("x"),
          this.keymap("berry"),
        ]),
      ]),
      UI.h("div", { class: "kate-keyboard-mapping-actions" }, [
        UI.text_button(this.os, "Save", {
          primary: true,
          on_click: async () => {
            this.on_save();
          },
          enabled: this._changed,
        }),
        UI.text_button(this.os, "Cancel", {
          on_click: async () => {
            this.on_return();
          },
          enabled: this._wait_key.map((x) => !x),
        }),
        UI.text_button(this.os, "Defaults", {
          on_click: async () => {
            this.revert_defaults();
          },
        }),
      ]),
    ];
  }

  revert_defaults() {
    this._mapping = this.os.settings.defaults.input.keyboard_mapping.slice();
    const keys: KateButton[] = [
      "up",
      "right",
      "down",
      "left",
      "ltrigger",
      "rtrigger",
      "x",
      "o",
      "menu",
      "capture",
    ];
    for (const key of keys) {
      this.update_key_mapping(key, null);
    }
    for (const entry of this._mapping) {
      this.update_key_mapping(entry.button, entry.key);
    }
    this._changed.value = true;
  }

  on_save = async () => {
    await this.os.settings.update("input", (x) => {
      return { ...x, keyboard_mapping: this._mapping };
    });
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "low",
      type: "kate.settings.keyboard.updated-mapping",
      message: "Updated keyboard mapping",
      extra: this._mapping,
    });
    this.os.kernel.keyboard_source.remap(this._mapping);
    this.close();
  };

  keymap(key: KateButton) {
    const kbd = this._mapping.find((x) => x.button === key);
    const container = UI.h("div", { class: "kate-wireframe-mapping-button", "data-key": key }, []);
    const update = async (key: string | null) => {
      container.setAttribute("title", key ?? "");
      container.textContent = "";
      UI.append(await friendly_kbd(key), container);
    };
    update(kbd?.key ?? null);
    return UI.h("div", { class: "kate-wireframe-mapping" }, [
      UI.interactive(this.os, container, [
        {
          key: ["o"],
          label: "Select key",
          on_click: true,
          handler: async () => {
            const waiter = this.ask_key(key);
            this._wait_key.value = waiter;
            const kbd_key = await waiter.promise;
            this._wait_key.value = null;
            if (kbd_key != null && (await this.associate(key, kbd_key))) {
              update(kbd_key);
              this._changed.value = true;
            }
          },
          enabled: () => this._wait_key.value == null,
        },
      ]),
    ]);
  }

  async update_key_mapping(key: KateButton, kbd: string | null) {
    const container = this.canvas.querySelector(
      `.kate-wireframe-mapping-button[data-key=${JSON.stringify(key)}]`
    );
    if (container != null) {
      container.setAttribute("title", kbd ?? "");
      container.textContent = "";
      UI.append(await friendly_kbd(kbd), container);
    }
  }

  async associate(key: KateButton, kbd: string) {
    const previous = this._mapping.find((x) => x.key === kbd);
    const mapping = this._mapping.filter((x) => x.key !== kbd && x.button !== key);
    if (previous != null && previous.button !== key) {
      const should_associate = await this.os.dialog.confirm("kate:settings", {
        title: "Replace mapping?",
        message: `"${kbd}" is already associated with the virtual button "${previous.button}". Replace with "${key}"?`,
        cancel: "Keep old mapping",
        ok: "Replace",
      });
      if (should_associate) {
        this.update_key_mapping(previous.button, null);
        this._mapping = mapping.concat([
          {
            key: kbd,
            button: key,
          },
        ]);
        return true;
      } else {
        return false;
      }
    } else {
      this._mapping = mapping.concat([
        {
          key: kbd,
          button: key,
        },
      ]);
      return true;
    }
  }

  ask_key(key: KateButton) {
    const result = defer<string | null>();
    const dialog = UI.h("div", { class: "kate-screen-dialog kate-screen-kbd-dialog" }, [
      UI.h("div", { class: "kate-screen-dialog-container" }, [
        UI.hbox(0.5, [
          UI.h("span", {}, ["Press a key in your keyboard to associate with "]),
          UI.icon(key),
          UI.h("span", {}, [`(${key})`]),
          UI.h("input", { class: "wait-for-key" }, []),
        ]),
      ]),
    ]);
    const input = dialog.querySelector("input") as HTMLInputElement;
    const handle_key = (ev: KeyboardEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      result.resolve(ev.code);
    };
    const click_cancel = (ev: MouseEvent) => {
      ev.preventDefault();
      result.resolve(null);
    };
    const x_cancel = (ev: ButtonChangeEvent) => {
      if (ev.button === "x") {
        result.resolve(null);
      }
    };
    const dismiss = () => {
      this.os.focus_handler.pop_root(dialog);
      dialog.remove();
      input.removeEventListener("keydown", handle_key);
      dialog.removeEventListener("click", click_cancel);
      this.os.kernel.console.button_input.virtual_source.on_button_changed.remove(x_cancel);
    };
    input.addEventListener("keydown", handle_key);
    dialog.addEventListener("click", click_cancel);
    this.os.kernel.console.button_input.virtual_source.on_button_changed.listen(x_cancel);
    this.canvas.append(dialog);
    input.focus();
    this.os.focus_handler.push_root(dialog);
    result.promise.finally(() => {
      dismiss();
    });
    return result;
  }
}

export async function friendly_kbd(x: string | null) {
  if (x == null) {
    return null;
  }

  if (navigator.keyboard != null) {
    const layout = await navigator.keyboard.getLayoutMap();
    return layout.get(x) ?? friendly_name[x] ?? x;
  } else {
    return friendly_name[x] ?? x;
  }
}

export const friendly_name: { [key: string]: string | undefined } = Object.assign(
  Object.create(null),
  {
    ArrowLeft: UI.fa_icon("arrow-left"),
    ArrowRight: UI.fa_icon("arrow-right"),
    ArrowUp: UI.fa_icon("arrow-up"),
    ArrowDown: UI.fa_icon("arrow-down"),
    KeyQ: "Q",
    KeyW: "W",
    KeyE: "E",
    KeyR: "R",
    KeyT: "T",
    KeyY: "Y",
    KeyU: "U",
    KeyI: "I",
    KeyO: "O",
    KeyP: "P",
    KeyA: "A",
    KeyS: "S",
    KeyD: "D",
    KeyF: "F",
    KeyG: "G",
    KeyH: "H",
    KeyJ: "J",
    KeyL: "L",
    KeyK: "K",
    KeyN: "N",
    KeyM: "M",
    KeyB: "B",
    KeyV: "V",
    KeyC: "C",
    KeyX: "X",
    KeyZ: "Z",
    Delete: "Delete",
    End: "End",
    PageDown: "PgDn",
    PageUp: "PgUp",
    Insert: "Insert",
    Home: "Home",
    Enter: "Enter",
    Backspace: UI.fa_icon("delete-left"),
    Digit0: "0",
    Digit9: "9",
    Digit8: "8",
    Digit7: "7",
    Digit6: "6",
    Digit5: "5",
    Digit4: "4",
    Digit3: "3",
    Digit2: "2",
    Digit1: "1",
    Tab: "Tab",
    CapsLock: "CapsLock",
    ShiftLeft: "L Shift",
    ControlLeft: "L Ctrl",
    MetaLeft: "L Meta",
    AltLeft: "L Alt",
    Space: "Space",
    AltRight: "R Alt",
    ControlRight: "R Ctrl",
    ShiftRight: "R Shift",
    ContextMenu: "Context",
    MetaRight: "R Meta",
    NumpadDecimal: "Np .",
    NumpadEnter: "Np Enter",
    Numpad0: "Np 0",
    Numpad1: "Np 1",
    Numpad2: "Np 2",
    Numpad3: "Np 3",
    Numpad4: "Np 4",
    Numpad5: "Np 5",
    Numpad6: "Np 6",
    Numpad7: "Np 7",
    Numpad8: "Np 8",
    Numpad9: "Np 9",
    NumpadAdd: "Np +",
    NumpadDivide: "Np /",
    NumpadMultiply: "Np *",
    NumpadSubtract: "Np -",
    F1: "F1",
    F2: "F2",
    F3: "F3",
    F4: "F4",
    F5: "F5",
    F6: "F6",
    F7: "F7",
    F8: "F8",
    F9: "F9",
    F10: "F10",
    F11: "F11",
    F12: "F12",
    Escape: "Escape",
  }
);
