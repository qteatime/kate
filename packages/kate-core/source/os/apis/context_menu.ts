import type { ExtendedInputKey, SpecialInputKey } from "../../kernel/virtual";
import type { KateOS } from "../os";
import { Scene, SceneLicence, SceneMedia } from "../ui/scenes";
import * as UI from "../ui";
import { EventStream } from "../../../../util/build/events";

declare global {
  function showOpenFilePicker(options: {
    types: { description: string; accept: { [key: string]: string[] } }[];
    multiple: boolean;
    excludeAcceptAllOption: boolean;
  }): FileSystemFileHandle[];
}

export class KateContextMenu {
  private in_context = false;

  constructor(readonly os: KateOS) {}

  setup() {
    this.os.kernel.console.on_key_pressed.listen(this.handle_key_press);
  }

  teardown() {
    this.os.kernel.console.on_key_pressed.remove(this.handle_key_press);
  }

  handle_key_press = (key: ExtendedInputKey) => {
    switch (key) {
      case "long_menu": {
        this.show_context_menu();
        break;
      }
    }
  };

  show_context_menu() {
    if (this.in_context) {
      return;
    }
    this.in_context = true;
    const menu = new HUD_ContextMenu(this.os, this);
    menu.on_close.listen(() => {
      this.in_context = false;
    });
    this.os.push_scene(menu);
  }
}

export class HUD_ContextMenu extends Scene {
  readonly on_close = new EventStream<void>();

  constructor(readonly os: KateOS, readonly context: KateContextMenu) {
    super(os);
  }

  render() {
    const fullscreen_button = () =>
      new UI.Button(["Toggle fullscreen"]).on_clicked(
        this.on_toggle_fullscreen
      );

    return UI.h("div", { class: "kate-os-hud-context-menu" }, [
      UI.h("div", { class: "kate-os-hud-context-menu-backdrop" }, []),
      UI.h("div", { class: "kate-os-hud-context-menu-content" }, [
        UI.h("div", { class: "kate-os-hud-context-menu-items" }, [
          new UI.If(() => this.os.processes.running != null, {
            then: new UI.Menu_list([
              new UI.Button(["Close game"]).on_clicked(this.on_close_game),
              fullscreen_button(),
              new UI.Button(["Legal notices"]).on_clicked(
                this.on_legal_notices
              ),
              new UI.Button(["Media gallery"]).on_clicked(
                this.on_media_gallery
              ),
            ]),
            else: new UI.Menu_list([
              new UI.Button(["Power off"]).on_clicked(this.on_power_off),
              fullscreen_button(),
              new UI.Button(["Install from file"]).on_clicked(
                this.on_install_from_file
              ),
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
    this.os.focus_handler.listen(this.canvas, this.handle_key_pressed);
  }

  on_detached(): void {
    this.os.focus_handler.remove(this.canvas, this.handle_key_pressed);
  }

  handle_key_pressed = (key: ExtendedInputKey) => {
    switch (key) {
      case "x": {
        this.on_return();
        return true;
      }
    }

    return false;
  };

  on_media_gallery = async () => {
    const process = this.os.processes.running!;
    const meta = await this.os.cart_manager.read_meta(process.cart.id);
    const media = new SceneMedia(this.os, meta);
    this.os.push_scene(media);
  };

  on_legal_notices = () => {
    const process = this.os.processes.running!;
    const legal = new SceneLicence(
      this.os,
      process.cart.metadata.title.title,
      process.cart.metadata.release.legal_notices
    );
    this.os.push_scene(legal);
  };

  on_toggle_fullscreen = () => {
    this.close();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.os.kernel.console.request_fullscreen();
    }
  };

  close() {
    this.os.pop_scene();
    this.on_close.emit();
  }

  on_install_from_file = async () => {
    this.close();

    return new Promise<void>((resolve, reject) => {
      const installer = document.querySelector(
        "#kate-installer"
      ) as HTMLInputElement;
      const teardown = () => {
        installer.onchange = () => {};
        installer.onerror = () => {};
        installer.onabort = () => {};
      };
      installer.onchange = async (ev) => {
        try {
          const file = installer.files!.item(0)!;
          await this.os.cart_manager.install_from_file(file);
          teardown();
          resolve();
        } catch (error) {
          teardown();
          reject(error);
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
    await this.os.processes.running?.exit();
  };

  on_return = async () => {
    this.close();
  };

  on_power_off = async () => {
    this.close();
    window.close();
  };
}
