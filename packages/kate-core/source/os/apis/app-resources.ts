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

import { make_id, sleep } from "../../utils";
import type { KateOS } from "../os";

type WorkerMessage = { type: "refresh-cache" } | { type: "version" } | { type: "force-update" };

export class KateAppResources {
  private _listening_for_updates = false;
  private _has_update: string | null = null;
  readonly CACHE_REFRESH_TIMEOUT = 1000 * 60 * 5; // 5 min

  constructor(readonly os: KateOS) {}

  async listen_for_updates() {
    if (this._listening_for_updates) {
      throw new Error(`[kate:app-resources] listen_for_updates() called twice`);
    }
    this._listening_for_updates = true;
    if (this.worker != null) {
      const reg = await this.registration;
      if (reg?.installing || reg?.waiting) {
        this.handle_update_found().catch(() => {});
      } else {
        reg?.addEventListener("updatefound", this.handle_update_found);
      }
      console.debug(`[kate:app-resources] Listening for Kate updates`);
    }
  }

  get has_update() {
    return this._has_update;
  }

  get registration() {
    return navigator.serviceWorker.getRegistration("worker.js");
  }

  get worker() {
    if (this.os.kernel.console.options.mode !== "web") {
      return null;
    } else {
      return navigator.serviceWorker.controller ?? null;
    }
  }

  async send(message0: WorkerMessage, to_worker: ServiceWorker | null = null) {
    const worker = to_worker ?? (await this.worker);
    if (!worker) {
      return;
    }

    return new Promise((resolve, reject) => {
      const id = make_id();
      const message = { ...message0, id };
      const channel = new MessageChannel();

      channel.port1.onmessage = (ev: MessageEvent<any>) => {
        if (ev.data.type !== "reply" || ev.data.id !== id) {
          return;
        }
        if (ev.data.ok) {
          resolve(ev.data.value);
        } else {
          reject(ev.data.error);
        }
      };

      worker?.postMessage(message, [channel.port2]);
    });
  }

  async refresh_cache() {
    if (this.worker == null) {
      return;
    }

    // ensure we are online by reading a non-cached resource
    const response = await fetch("/worker.js");
    if (!response.ok) {
      throw new Error(`Refreshing the cache requires network access`);
    }

    const refresh = this.send({
      type: "refresh-cache",
    }).then((result) => {
      if (!result) {
        throw new Error(`Failed to update the cache`);
      }
    });
    const timeout = sleep(this.CACHE_REFRESH_TIMEOUT).then((x) =>
      Promise.reject(new Error("timeout"))
    );
    await Promise.race([refresh, timeout]);
  }

  async force_update() {
    const reg = await this.registration;
    if (reg == null || reg.waiting == null) {
      return false;
    }

    await this.send({ type: "force-update" }, reg.waiting);
    return true;
  }

  private handle_update_found = async () => {
    if (this._has_update) {
      return;
    }

    const notify_new_version = async (worker: ServiceWorker) => {
      const version = (await this.send({ type: "version" }, worker)) as string;
      this._has_update = version;
      await this.os.notifications.push(
        "kate:app-resources",
        `Kate v${version} available!`,
        "Close and re-open the application to install."
      );
    };

    const reg = await this.registration;
    if (reg?.installing) {
      const worker = reg.installing;
      const handler = () => {
        if (worker.state === "activating") {
          worker.removeEventListener("statechange", handler);
          notify_new_version(worker);
        }
      };
      worker.addEventListener("statechange", handler);
    } else if (reg?.waiting) {
      notify_new_version(reg.waiting);
    }
  };
}
