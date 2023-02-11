import * as Cart from "../../../../schema/generated/cartridge";
import type { CR_Process } from "../../kernel/cart-runtime";
import { KateOS } from "../os";
import { h } from "../ui";
import { Scene } from "../ui/scenes";
import * as Db from "./db";

export class KateProcesses {
  private _running: KateProcess | null = null;

  constructor(readonly os: KateOS) {}

  get is_busy() {
    return this._running != null;
  }

  get running() {
    return this._running;
  }

  async run(id: string) {
    if (this.is_busy) {
      throw new Error(`process already running`);
    }

    const loading = new HUD_LoadIndicator(this.os);
    this.os.show_hud(loading);
    this.os.focus_handler.change_root(null);
    try {
      const cart = await this.os.db.transaction(
        [Db.cart_files],
        "readonly",
        async (t) => {
          const files = t.get_table(Db.cart_files);
          const file = await files.get(id);
          return this.os.kernel.loader.load_bytes(file.bytes.buffer);
        }
      );
      const storage = this.os.kv_storage.get_store(cart.id);
      const runtime = this.os.kernel.runtimes.from_cartridge(
        cart,
        await storage.contents()
      );
      const process = new KateProcess(this, cart, runtime.run(this.os));
      this._running = process;
      this.os.kernel.console.os_root.classList.add("in-background");
      return process;
    } finally {
      this.os.hide_hud(loading);
    }
  }

  notify_exit(process: KateProcess) {
    if (process === this._running) {
      this._running = null;
      this.os.focus_handler.focus_current_scene();
      this.os.kernel.console.os_root.classList.remove("in-background");
    }
  }
}

export class HUD_LoadIndicator extends Scene {
  render() {
    return h("div", { class: "kate-hud-load-screen" }, ["Loading..."]);
  }
}

export class KateProcess {
  private _paused: boolean = false;

  constructor(
    readonly manager: KateProcesses,
    readonly cart: Cart.Cartridge,
    readonly runtime: CR_Process
  ) {}

  async pause() {
    if (this._paused) return;
    this._paused = true;
    await this.runtime.pause();
  }

  async unpause() {
    if (!this._paused) return;
    this._paused = false;
    await this.runtime.unpause();
  }

  async exit() {
    await this.runtime.exit();
    this.manager.notify_exit(this);
  }
}
