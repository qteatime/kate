/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart from "../../cart";
import type { KateOS } from "../os";
import { SceneGame } from "../apps/game";
import { HUD_LoadIndicator } from "../apps/load-screen";
import type { Scene } from "../ui";
import { serialise_error } from "../../utils";
import { Process, SystemEvent } from "../../kernel";

export class KateProcesses {
  private _running: Process | null = null;
  private _scenes = new WeakMap<Process, Scene>();
  private _initialised = false;

  constructor(readonly os: KateOS) {}

  get is_busy() {
    return this._running != null;
  }

  get running() {
    return this._running;
  }

  setup() {
    if (this._initialised) {
      throw new Error(`[kate:processes] Process manager initialised twice`);
    }
    this._initialised = true;
    this.os.kernel.processes.on_system_event.listen(this.handle_system_event);
  }

  async run_from_cartridge(bytes: Uint8Array) {
    if (this.is_busy) {
      throw new Error(`a process is already running`);
    }

    const file = new Blob([bytes], { type: "application/octet-stream" });
    const { metadata: cart, file_map } = await Cart.parse_whole(file, this.os.kernel.version);

    const storage = await this.os.object_store.cartridge(cart, false).get_local_storage();
    const process = await this.os.kernel.processes.spawn({
      console: this.os.kernel.console,
      cart: cart,
      local_storage: storage,
      filesystem: {
        read: async (path) => {
          const file = file_map.get(path);
          if (file == null) {
            throw new Error(`File not found in ${cart.id}: ${path}`);
          }
          return file;
        },
      },
    });
    return await this.display_process(process);
  }

  private async display_process(process: Process) {
    const scene = new SceneGame(this.os, process);
    this._running = process;
    this.os.push_scene(scene);
    this._scenes.set(process, scene);
    this.os.ipc.add_process(process);
    await process.pair().catch(async (e) => {
      await this.os.audit_supervisor.log(process.id, {
        risk: "high",
        type: "kate.process.pairing-crashed",
        message: `Pairing ${process.id} took too long; cartridge may be corrupted.`,
        resources: ["error", "kate:cartridge"],
      });
      process.kill();
      throw e;
    });
    return process;
  }

  is_running(cart_id: string) {
    return this.running?.cartridge.id === cart_id;
  }

  is_foreground(process: Process) {
    const scene = this._scenes.get(process);
    return this.os.current_scene === scene;
  }

  async terminate(id: string, requester: string, reason: string) {
    if (this._running != null && this._running.cartridge.id === id) {
      await this.os.audit_supervisor.log(requester, {
        resources: ["kate:cartridge", "error"],
        risk: "high",
        type: "kate.process.terminated",
        message: `Terminated process ${id} for ${reason}`,
        extra: { cartridge: id, reason: reason },
      });
      await this.os.notifications.push_transient(
        requester,
        "Process terminated",
        `${id} was terminated for ${reason}.`
      );
      await this._running.kill();
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

      const storage = await this.os.object_store.cartridge(cart, false).get_local_storage();
      const process = await this.os.kernel.processes.spawn({
        console: this.os.kernel.console,
        cart: cart,
        local_storage: storage,
        filesystem: {
          read: async (path) => {
            const file_id = file_map.get(path);
            if (file_id == null) {
              throw new Error(`File not found in ${cart.id}: ${path}`);
            }
            const file = await this.os.cart_manager.read_file_by_id(id, file_id);
            return { mime: file.mime, data: file.data, path: path };
          },
        },
      });
      await this.os.play_habits.track(process);
      return this.display_process(process);
    } catch (error) {
      this._running = null;
      console.error(`Failed to run cartridge ${id}:`, error);
      await this.os.audit_supervisor.log("kate:process", {
        resources: ["kate:cartridge", "error"],
        risk: "high",
        type: "kate.process.execution-failed",
        message: `Failed to run ${id}`,
        extra: { error: serialise_error(error) },
      });
      await this.os.notifications.push_transient(
        "kate:process",
        `Failed to run`,
        `Cartridge may be corrupted or not compatible with this version.`
      );
    } finally {
      this.os.hide_hud(loading);
    }
  }

  handle_system_event = (ev: SystemEvent) => {
    switch (ev.type) {
      case "killed": {
        this.notify_exit(ev.process);
        break;
      }

      case "unexpected-message": {
        console.warn(`Unexpected message received from ${ev.process.id}`);
        this.os.audit_supervisor
          .log(ev.process.id, {
            type: "kate.process.unexpected-message",
            message: `Unexpected message received from ${ev.process.id}`,
            risk: "low",
            resources: ["kate:cartridge"],
            extra: ev.message,
          })
          .catch(() => {});
        ev.process.kill();
        break;
      }
    }
  };

  notify_exit(process: Process) {
    if (process === this._running) {
      this._running = null;
      this.os.ipc.remove_process(process);
      const scene = this._scenes.get(process);
      scene?.close();
    }
  }
}
