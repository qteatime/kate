import type { ExtendedInputKey, SpecialInputKey } from "../../kernel/virtual";
import type { KateOS } from "../os";
import { Scene, SceneLicence } from "../ui/scenes";
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
    this.os.processes.running?.pause();
    const menu = new HUD_ContextMenu(this.os, this);
    menu.on_close.listen(() => {
      this.in_context = false;
      // We want to avoid key presses being propagated on this tick
      this.os.kernel.console.on_tick.once(() => {
        this.os.processes.running?.unpause();
      });
      this.os.focus_handler.pop_root(menu.canvas);
    });
    this.os.show_hud(menu);
    this.os.focus_handler.push_root(menu.canvas);
  }

  exit_context() {
    this.in_context = false;
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
        new UI.If(() => this.os.processes.running != null, {
          then: new UI.Menu_list([
            new UI.Button(["Close game"]).on_clicked(this.on_close_game),
            fullscreen_button(),
            new UI.Button(["Legal notices"]).on_clicked(this.on_legal_notices),
            new UI.Button(["Return"]).on_clicked(this.on_return),
          ]),
          else: new UI.Menu_list([
            new UI.Button(["Power off"]).on_clicked(this.on_power_off),
            fullscreen_button(),
            new UI.Button(["Install from file"]).on_clicked(
              this.on_install_from_file
            ),
            new UI.Button(["Return"]).on_clicked(this.on_return),
          ]),
        }),
      ]),
    ]);
  }

  on_legal_notices = () => {
    this.close(false);
    this.os.focus_handler.pop_root(this.canvas);
    this.context.exit_context();
    const process = this.os.processes.running!;
    const legal = new SceneLicence(
      this.os,
      process.cart.metadata.title.title,
      process.cart.metadata.release.legal_notices,
      () => {
        this.os.switch_mode("game");
        this.os.kernel.console.on_tick.once(() => {
          process.unpause();
        });
      }
    );
    this.os.push_scene(legal);
    this.os.switch_mode("os");
  };

  on_toggle_fullscreen = () => {
    this.close();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.os.kernel.console.request_fullscreen();
    }
  };

  close(notify = true) {
    this.os.hide_hud(this);
    if (notify) {
      this.on_close.emit();
    }
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
    window.close();
    this.os.hide_hud(this);
    this.on_close.emit();
  };
}
