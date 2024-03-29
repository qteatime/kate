/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { KeyStore_v1, TrustStore } from "../../../data";
import { Observable, relative_date } from "../../../utils";
import type { KateOS } from "../../os";
import * as UI from "../../ui";

export class SceneKeyStoreSettings extends UI.SimpleScene {
  readonly application_id = "kate:settings:key-store";
  icon = "vault";
  title = ["Secure key store"];

  body() {
    const config = this.os.settings.get("key_store");

    return [
      UI.p([
        `Here you can view and manage all signing and verification keys
        that your device has trusted. You can also import and export them.
        Private keys are always encrypted with your master password.`,
      ]),

      UI.h("h3", {}, ["Your store security"]),
      UI.when(config.master_key != null, [
        UI.link_card(this.os, {
          icon: "key",
          title: "Change your master password",
          description: `This will re-encrypt your key store with the new password.`,
          on_click: () => {
            this.os.push_scene(new SceneChangeMasterPassword(this.os));
          },
        }),
      ]),
      UI.when(config.master_key == null, [
        UI.link_card(this.os, {
          icon: "key",
          title: "Create a master password",
          description: `This will configure a master password for your key store, and allow
        you to store private keys in it.`,
          on_click: () => {
            this.os.push_scene(new SceneCreateMasterPassword(this.os), () => {
              this.refresh();
            });
          },
        }),
      ]),

      UI.h("h3", {}, ["Keys in the store"]),
      UI.link_card(this.os, {
        icon: "vault",
        title: "Sensitive verification keys",
        description: `Keys that your device uses to verify sensitive operations, such as
          changes to Kate itself.`,
        on_click: () => {
          this.os.push_scene(new SceneKeyStoreList(this.os, "trusted"));
        },
      }),
      UI.link_card(this.os, {
        icon: "vault",
        title: "Publishers you trust",
        description: `Keys from publishers you trust, used to verify that the cartridges
          you install come from the sources you expect.`,
        on_click: () => {
          this.os.push_scene(new SceneKeyStoreList(this.os, "publisher"));
        },
      }),
      UI.link_card(this.os, {
        icon: "vault",
        title: "Your personal keys",
        description: `Keys that belong to you and are used to verify your own cartridges.`,
        on_click: () => {
          this.os.push_scene(new SceneKeyStoreList(this.os, "personal"));
        },
      }),
    ];
  }
}

export class SceneCreateMasterPassword extends UI.SimpleScene {
  readonly application_id = "kate:settings:key-store:create-master-password";
  icon = "key";
  title = ["Create a password for your key store"];

  body() {
    return [
      UI.form((form) => {
        const new_pass = form.observe_value("new-pass");
        const confirm = form.observe_value("confirm-pass");
        const good_pass = new_pass.map((x) =>
          x == null
            ? null
            : x.length < 16
            ? "Your password should have at least 16 characters."
            : null
        );
        const confirmed = new_pass.zip_with(confirm, (p1, pc) =>
          p1 == null || pc == null ? null : p1 !== pc ? "The passwords do not match." : null
        );

        return [
          UI.h("input", { type: "hidden", name: "username", value: "kate" }, []),
          UI.p([
            `A good password should have at least 16 characters, including
            letters, numbers, and symbols. Using a password manager is recommended.`,
          ]),
          UI.field("New password", [
            UI.text_input(this.os, {
              name: "new-pass",
              type: "password",
              autocomplete: ["new-password"],
            }),
            UI.klass("kate-ui-text-input-error", [
              UI.dynamic(good_pass as Observable<UI.Widgetable>),
            ]),
          ]),

          UI.field("Confirm your new password", [
            UI.text_input(this.os, {
              name: "confirm-pass",
              type: "password",
              autocomplete: ["new-password"],
            }),
            UI.klass("kate-ui-text-input-error", [
              UI.dynamic(confirmed as Observable<UI.Widgetable>),
            ]),
          ]),

          UI.text_button(this.os, "Create password", {
            enabled: good_pass.zip_with(confirmed, (a, b) => a == null && b == null),
            primary: true,
            on_click: () => {
              if (good_pass.value == null && confirmed.value == null && new_pass.value != null) {
                this.create_password(new_pass.value);
              }
            },
          }),
        ];
      }),
    ];
  }

  async create_password(password: string) {
    await this.os.key_manager.generate_master_key(password);
    await this.os.dialog.message("kate:key-store:settings", {
      title: "Your store is protected",
      message: UI.h("div", {}, [
        UI.p(["Your store is now encrypted by your master password."]),
        UI.p([
          `You'll now be able to store private keys and retrieve them by providing
        your master password when needed. Keys are cached for a short while after you
        unlock the key store.`,
        ]),
      ]),
    });
    this.close();
  }
}

export class SceneChangeMasterPassword extends UI.SimpleScene {
  readonly application_id = "kate:settings:key-store:change-master-password";
  icon = "key";
  title = ["Change your key store password"];

  body() {
    return [
      UI.form((form) => {
        const old_pass = form.observe_value("old-pass");
        const new_pass = form.observe_value("new-pass");
        const confirm = form.observe_value("confirm-pass");
        const good_pass = new_pass.map((x) =>
          x == null
            ? null
            : x.length < 16
            ? "Your password should have at least 16 characters."
            : null
        );
        const confirmed = new_pass.zip_with(confirm, (p1, pc) =>
          p1 == null || pc == null ? null : p1 !== pc ? "The passwords do not match." : null
        );
        const has_old_pass = old_pass.map((x) =>
          x == null
            ? null
            : x.length === 0
            ? `Your current password is needed to re-encrypt the key store`
            : null
        );

        return [
          UI.h("input", { type: "hidden", name: "username", value: "kate" }, []),
          UI.p([
            `A good password should have at least 16 characters, including
            letters, numbers, and symbols. Using a password manager is recommended.`,
          ]),
          UI.field("Current password", [
            UI.text_input(this.os, {
              name: "old-pass",
              type: "password",
              autocomplete: ["current-password"],
            }),
            UI.klass("kate-ui-text-input-error", [
              UI.dynamic(has_old_pass as Observable<UI.Widgetable>),
            ]),
          ]),

          UI.field("New password", [
            UI.text_input(this.os, {
              name: "new-pass",
              type: "password",
              autocomplete: ["new-password"],
            }),
            UI.klass("kate-ui-text-input-error", [
              UI.dynamic(good_pass as Observable<UI.Widgetable>),
            ]),
          ]),

          UI.field("Confirm your new password", [
            UI.text_input(this.os, {
              name: "confirm-pass",
              type: "password",
              autocomplete: ["new-password"],
            }),
            UI.klass("kate-ui-text-input-error", [
              UI.dynamic(confirmed as Observable<UI.Widgetable>),
            ]),
          ]),

          UI.text_button(this.os, "Change password", {
            enabled: good_pass.zip_with(confirmed, (a, b) => a == null && b == null),
            primary: true,
            on_click: () => {
              if (
                old_pass.value != null &&
                good_pass.value == null &&
                confirmed.value == null &&
                new_pass.value != null
              ) {
                this.change_password(old_pass.value, new_pass.value);
              }
            },
          }),
        ];
      }),
    ];
  }

  async change_password(old_password: string, new_password: string) {
    await this.os.key_manager.rotate_master_key(this.application_id, old_password, new_password);
    await this.os.dialog.message("kate:key-store:settings", {
      title: "Your password was changed",
      message: UI.h("div", {}, [
        UI.p(["Your store is now encrypted using your new master password."]),
      ]),
    });
    this.close();
  }
}

export class SceneKeyStoreList extends UI.SimpleScene {
  readonly application_id = "kate:settings:key-store:list";
  icon = "vault";
  get title() {
    return [`Key store: ${this.store}`];
  }

  constructor(os: KateOS, readonly store: TrustStore) {
    super(os);
  }

  async body() {
    const keys = await this.os.key_manager.public_keys_in_store(this.store);

    return [
      UI.p([`The following keys are automatically sync'd to your store by Kate.`]),

      ...keys.map((x) => UI.lazy(this.render_key(x))),
    ];
  }

  async render_key(x: KeyStore_v1) {
    return UI.interactive(
      this.os,
      UI.klass("kate-ui-key-entry", [
        UI.klass("kate-ui-key-entry-title", [x.comment]),
        UI.klass("kate-ui-key-entry-domain", [UI.meta_text([x.domain])]),
        UI.klass("kate-ui-key-entry-fp", [UI.meta_text([x.fingerprint])]),
        UI.klass("kate-ui-key-entry-meta", [
          "Added ",
          relative_date(x.added_at),
          " | ",
          "Last updated ",
          relative_date(x.updated_at),
          " | ",
          "Last used ",
          relative_date(x.last_used_at),
        ]),
      ]),
      []
    );
  }
}
