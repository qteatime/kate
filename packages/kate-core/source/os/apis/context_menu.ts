/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateOS } from "../os";
import { Scene } from "../ui/scenes";
import { SceneAboutKate } from "../apps/about-kate";
import { SceneMedia } from "../apps/media";
import { SceneTextFile } from "../apps/text-file";
import * as UI from "../ui";
import { EventStream } from "../../utils";
import { SceneSettings } from "../apps";
import { SceneCartridgeStorageSettings } from "../apps/settings/storage";
import { SceneCartridgePermissions } from "../apps/settings/permissions";
import { KateButton } from "../../kernel";

declare global {
  function showOpenFilePicker(options: {
    id?: string;
    types: { description: string; accept: { [key: string]: string[] } }[];
    multiple: boolean;
    excludeAcceptAllOption: boolean;
  }): Promise<FileSystemFileHandle[]>;

  function showDirectoryPicker(options?: {
    id?: string;
    mode?: "read" | "readwrite";
    startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
  }): Promise<FileSystemDirectoryHandle>;

  interface FileSystemDirectoryHandle {
    entries(): AsyncIterable<[string, FileSystemHandle]>;
  }
}

export class KateContextMenu {
  constructor(readonly os: KateOS) {}

  setup() {
    this.os.kernel.console.button_input.on_button_pressed.listen(this.handle_key_press);
  }

  teardown() {
    this.os.kernel.console.button_input.on_button_pressed.remove(this.handle_key_press);
  }

  handle_key_press = (x: { key: KateButton; is_repeat: boolean }) => {
    if (x.is_repeat) {
      return;
    }

    switch (x.key) {
      case "berry": {
        this.show_context_menu();
        break;
      }
    }
  };

  show_context_menu() {
    if (this.in_context()) {
      return;
    }
    const menu = new HUD_ContextMenu(this.os, this);
    this.os.push_scene(menu);
  }

  in_context() {
    return this.os.display.querySelector(".kate-os-hud-context-menu") != null;
  }
}

export class HUD_ContextMenu extends Scene {
  readonly application_id = "kate:context-menu";

  readonly on_close = new EventStream<void>();

  constructor(readonly os: KateOS, readonly context: KateContextMenu) {
    super(os, true);
  }

  render() {
    const fullscreen_button = () =>
      UI.when(emulator.options.mode !== "native", [
        UI.fa_icon_button("expand", "Fullscreen").on_clicked(this.on_toggle_fullscreen),
      ]);
    const emulator = this.os.kernel.console;
    const cart = this.os.processes.running?.cartridge;

    return UI.h("div", { class: "kate-os-hud-context-menu" }, [
      UI.h("div", { class: "kate-os-hud-context-menu-backdrop" }, []),
      UI.h("div", { class: "kate-os-hud-context-menu-content" }, [
        UI.h("div", { class: "kate-os-hud-context-menu-items" }, [
          new UI.If(() => this.os.processes.running != null, {
            then: new UI.Menu_list([
              UI.when(emulator.options.mode !== "single", [
                UI.fa_icon_button("square-xmark", "Close game").on_clicked(this.on_close_game),
              ]),
              fullscreen_button(),
              UI.when(cart?.metadata.legal.licence_path != null, [
                UI.fa_icon_button("circle-info", "Legal notices").on_clicked(() =>
                  this.on_legal_notices("Legal notices", cart?.metadata.legal.licence_path ?? null)
                ),
              ]),
              UI.when(cart?.metadata.legal.privacy_policy_path != null, [
                UI.fa_icon_button("circle-info", "Privacy policy").on_clicked(() =>
                  this.on_legal_notices(
                    "Privacy policy",
                    cart?.metadata.legal.privacy_policy_path ?? null
                  )
                ),
              ]),
              UI.fa_icon_button("images", "Media gallery").on_clicked(this.on_media_gallery),
              UI.fa_icon_button("hard-drive", "Storage").on_clicked(this.on_manage_data),
              UI.fa_icon_button("key", "Permissions").on_clicked(this.on_permissions),
              UI.menu_separator(),
              UI.fa_icon_button("cat", "About Kate").on_clicked(this.on_about_kate),
              UI.fa_icon_button("gear", "Settings").on_clicked(this.on_settings),
            ]),
            else: new UI.Menu_list([
              UI.when(emulator.options.mode === "native", [
                UI.fa_icon_button("power-off", "Power off").on_clicked(this.on_power_off),
              ]),
              fullscreen_button(),
              UI.fa_icon_button("download", "Install cartridge").on_clicked(
                this.on_install_from_file
              ),
              UI.fa_icon_button("images", "Media gallery").on_clicked(() => {
                this.on_media_gallery();
              }),
              UI.fa_icon_button("cat", "About Kate").on_clicked(() => {
                this.on_about_kate();
              }),
              UI.fa_icon_button("gear", "Settings").on_clicked(() => {
                this.on_settings();
              }),
            ]),
          }),
        ]),
        UI.h("div", { class: "kate-os-statusbar" }, [
          UI.icon_button("x", "Return").on_clicked(this.on_return),
          UI.icon_button("o", "Select").on_clicked(() => {}),
        ]),
      ]),
    ]);
  }

  on_attached(): void {
    this.canvas.setAttribute("data-title", "Context Menu");
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
    const backdrop = this.canvas.querySelector(".kate-os-hud-context-menu-backdrop") as HTMLElement;
    backdrop.addEventListener("click", (ev: Event) => {
      ev.preventDefault();
      this.on_return();
    });
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  handle_key_pressed = (x: { key: KateButton; is_repeat: boolean }) => {
    switch (x.key) {
      case "x": {
        if (!x.is_repeat) {
          this.on_return();
          return true;
        }
      }
    }

    return false;
  };

  on_media_gallery = async () => {
    const process = this.os.processes.running;
    if (process != null) {
      const media = new SceneMedia(this.os, {
        id: process.cartridge.id,
        title: process.cartridge.metadata.presentation.title,
      });
      this.os.push_scene(media);
    } else {
      const media = new SceneMedia(this.os, null);
      this.os.push_scene(media);
    }
  };

  on_manage_data = async () => {
    const process = this.os.processes.running;
    if (process == null) {
      throw new Error(`on_manage_data() called without a running process`);
    }
    const app = await this.os.storage_manager.try_estimate_live_cartridge(process.cartridge);
    this.os.push_scene(new SceneCartridgeStorageSettings(this.os, app));
  };

  on_permissions = async () => {
    const process = this.os.processes.running;
    if (process == null) {
      throw new Error(`on_permissions() called without a running process`);
    }
    this.os.push_scene(new SceneCartridgePermissions(this.os, process.cartridge));
  };

  on_legal_notices = async (title: string, path: string | null) => {
    const process = this.os.processes.running!;
    if (path == null) {
      console.error(`Cartridge has no legal notices`);
      return;
    }

    const licence_file = await process.file_system.read(path);
    const decoder = new TextDecoder();
    const licence = decoder.decode(licence_file.data);
    const legal = new SceneTextFile(
      this.os,
      title,
      process.cartridge.metadata.presentation.title,
      licence
    );
    this.os.push_scene(legal);
  };

  on_about_kate = () => {
    this.os.push_scene(new SceneAboutKate(this.os));
  };

  on_settings = () => {
    this.os.push_scene(new SceneSettings(this.os));
  };

  on_toggle_fullscreen = () => {
    this.close();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.os.kernel.console.case.request_fullscreen();
    }
  };

  close() {
    super.close();
    this.on_close.emit();
  }

  on_install_from_file = async () => {
    this.close();

    await new Promise<void>((resolve, reject) => {
      const installer = document.querySelector("#kate-installer") as HTMLInputElement;
      const teardown = () => {
        installer.onchange = () => {};
        installer.onerror = () => {};
        installer.onabort = () => {};
      };
      installer.onchange = async (ev) => {
        const status = this.os.status_bar.show("");
        try {
          const file = installer.files!.item(0)!;
          status.update(`Installing ${file.name}...`);
          await this.os.cart_manager.install_from_file(file);
          teardown();
          resolve();
        } catch (error) {
          teardown();
          reject(error);
        } finally {
          status.hide();
        }
      };
      installer.onerror = async () => {
        teardown();
        reject(new Error(`failed to install`));
      };
      installer.onabort = async () => {
        teardown();
        reject(new Error(`failed to install`));
      };
      installer.click();
    });
  };

  on_close_game = async () => {
    this.close();
    await this.os.processes.running?.kill();
  };

  on_return = async () => {
    this.close();
  };

  on_power_off = async () => {
    this.close();
    window.close();
  };
}
