/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
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

  async run_from_cartridge(blob: Blob) {
    if (this.is_busy) {
      throw new Error(`a process is already running`);
    }

    const cart = await Cart.parse_metadata(blob, this.os.kernel.version);
    const has_proper_offset = cart.files.every((x) => x.offset !== null);
    const file_map = new Map(cart.files.map((x) => [x.path, x]));
    if (!has_proper_offset) {
      throw new Error(`Running this cartridge is not supported without installation.`);
    }

    const storage = await this.os.object_store.cartridge(cart, false).get_local_storage();
    const process = await this.os.kernel.processes.spawn({
      console: this.os.kernel.console,
      cart: cart,
      local_storage: storage,
      file_paths: cart.files.map((x) => x.path),
      filesystem: {
        read: async (path) => {
          const node = file_map.get(path);
          if (node == null || node.offset == null) {
            throw new Error(`File not found in ${cart.id}: ${path}`);
          }
          const data = new Uint8Array(
            await blob.slice(node.offset, node.offset + node.size).arrayBuffer()
          );
          return {
            path: node.path,
            mime: node.mime,
            data,
          };
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
        file_paths: cart.files.map((x) => x.path),
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
