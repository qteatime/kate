import type {
  ExtendedInputKey,
  SpecialInputKey,
} from "../../kate-kernel/virtual";
import { KateOS } from "../os";
import { Scene } from "../ui/scenes";
import * as UI from "../ui";
import { EventStream } from "../../util/events";

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
      case "menu": {
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
    this.os.processes.running?.pause();
    const old_context = this.os.focus_handler.current_root;
    const menu = new HUD_ContextMenu(this.os);
    menu.on_close.listen(() => {
      this.in_context = false;
      this.os.processes.running?.unpause();
      this.os.focus_handler.compare_and_change_root(old_context, menu.canvas);
    });
    this.os.show_hud(menu);
    this.os.focus_handler.change_root(menu.canvas);
  }
}

export class HUD_ContextMenu extends Scene {
  readonly on_close = new EventStream<void>();

  constructor(readonly os: KateOS) {
    super(os);
  }

  render() {
    return UI.h("div", { class: "kate-os-hud-context-menu" }, [
      UI.h("div", { class: "kate-os-hud-context-menu-backdrop" }, []),
      UI.h("div", { class: "kate-os-hud-context-menu-content" }, [
        new UI.If(() => this.os.processes.running != null, {
          then: new UI.Menu_list([
            new UI.Button(["Close game"]).on_clicked(this.on_close_game),
            new UI.Button(["Return"]).on_clicked(this.on_return),
          ]),
          else: new UI.Menu_list([
            new UI.Button(["Power off"]).on_clicked(this.on_power_off),
            new UI.Button(["Install from file"]).on_clicked(
              this.on_install_from_file
            ),
            new UI.Button(["Return"]).on_clicked(this.on_return),
          ]),
        }),
      ]),
    ]);
  }

  on_install_from_file = async () => {
    this.os.hide_hud(this);
    this.on_close.emit();

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
    await this.os.processes.running?.exit();
    this.os.hide_hud(this);
    this.on_close.emit();
  };

  on_return = async () => {
    this.os.hide_hud(this);
    this.on_close.emit();
  };

  on_power_off = async () => {
    window.close();
    this.os.hide_hud(this);
    this.on_close.emit();
  };
}
