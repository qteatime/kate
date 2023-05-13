import * as Cart from "../../cart";
import type { CR_Process, CartRuntime } from "../../kernel/cart-runtime";
import type { KateOS } from "../os";
import { SceneGame } from "../apps/game";
import { HUD_LoadIndicator } from "../apps/load-screen";

export class KateProcesses {
  private _running: KateProcess | null = null;

  constructor(readonly os: KateOS) {}

  get is_busy() {
    return this._running != null;
  }

  get running() {
    return this._running;
  }

  async run_from_cartridge(bytes: Uint8Array) {
    if (this.is_busy) {
      throw new Error(`a process is already running`);
    }

    const cart = Cart.parse(bytes);
    const file_map = new Map(cart.files.map((x) => [x.path, x] as const));

    const storage = await this.os.object_store
      .cartridge(cart, false)
      .get_local_storage();
    const runtime = this.os.kernel.runtimes.from_cartridge(cart, {
      console: this.os.kernel.console,
      cart: cart,
      local_storage: storage,
      async read_file(path): Promise<Cart.File> {
        const file = file_map.get(path);
        if (file == null) {
          throw new Error(`File not found in ${cart.metadata.id}: ${path}`);
        }
        return file;
      },
      on_playtime_update: () => {},
    });
    return await this.display_process(cart, runtime);
  }

  private async display_process(cart: Cart.CartMeta, runtime: CartRuntime) {
    const process = new KateProcess(this, cart, await runtime.run(this.os));
    this._running = process;
    this.os.push_scene(new SceneGame(this.os, process));
    return process;
  }

  async terminate(id: string, requester: string, reason: string) {
    if (this._running != null && this._running.cart.metadata.id === id) {
      await this.os.notifications.push(
        requester,
        "Process terminated",
        `${id} was terminated for ${reason}.`
      );
      await this._running.exit();
    }
  }

  async run(id: string) {
    if (this.is_busy) {
      throw new Error(`a process is already running`);
    }

    const loading = new HUD_LoadIndicator(this.os);
    this.os.show_hud(loading);
    try {
      const cart = await this.os.cart_manager.read_metadata(id);
      const file_map = new Map(cart.files.map((x) => [x.path, x.id] as const));

      const storage = await this.os.object_store
        .cartridge(cart, false)
        .get_local_storage();
      const runtime = this.os.kernel.runtimes.from_cartridge(cart, {
        console: this.os.kernel.console,
        cart: cart,
        local_storage: storage,
        read_file: async (path) => {
          const file_id = file_map.get(path);
          if (file_id == null) {
            throw new Error(`File not found in ${cart.metadata.id}: ${path}`);
          }
          const file = await this.os.cart_manager.read_file_by_id(id, file_id);
          return { mime: file.mime, data: file.data, path: path };
        },
        on_playtime_update: async (time) => {
          await this.os.cart_manager.increase_play_time(id, time);
        },
      });
      await this.os.cart_manager.update_last_played(id, new Date());
      return this.display_process(cart, runtime);
    } catch (error) {
      this._running = null;
      console.error(`Failed to run cartridge ${id}:`, error);
      await this.os.notifications.push(
        "kate:os",
        `Failed to run`,
        `Cartridge may be corrupted or not compatible with this version.`
      );
    } finally {
      this.os.hide_hud(loading);
    }
  }

  notify_exit(process: KateProcess) {
    if (process === this._running) {
      this._running = null;
      this.os.pop_scene();
    }
  }
}

export class KateProcess {
  private _paused: boolean = false;

  constructor(
    readonly manager: KateProcesses,
    readonly cart: Cart.CartMeta,
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
