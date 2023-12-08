/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Db from "../../data";
import { Process, SystemEvent } from "../../kernel";
import type { KateOS } from "../os";

export class KatePlayHabits {
  constructor(readonly os: KateOS) {}

  async try_get(cart: string) {
    return await Db.PlayHabitsStore.transaction(this.os.db, "readonly", async (store) => {
      return store.habits.try_get(cart);
    });
  }

  async try_get_all(carts: string[]): Promise<Map<string, Db.PlayHabits>> {
    return await Db.PlayHabitsStore.transaction(this.os.db, "readonly", async (store) => {
      const results = new Map<string, Db.PlayHabits>();
      for (const cart of carts) {
        const habits = await store.habits.try_get(cart);
        if (habits != null) {
          results.set(cart, habits);
        }
      }
      return results;
    });
  }

  async all_in_database() {
    return await Db.PlayHabitsStore.transaction(this.os.db, "readonly", async (store) => {
      return store.habits.get_all();
    });
  }

  async remove_all() {
    await Db.PlayHabitsStore.transaction(this.os.db, "readwrite", async (store) => {
      await store.reset_all();
    });
  }

  async remove_one(id: string, remove: boolean) {
    await Db.PlayHabitsStore.transaction(this.os.db, "readwrite", async (store) => {
      if (remove) {
        store.remove(id);
      } else {
        store.reset(id);
      }
    });
  }

  async update_last_played(cart_id: string, last_played: Date | null) {
    if (!this.os.settings.get("play_habits").recently_played) {
      return;
    }

    await Db.PlayHabitsStore.transaction(this.os.db, "readwrite", async (store) => {
      const cart = await store.habits.get(cart_id);
      cart.last_played = last_played;
      await store.habits.put(cart);
    });
  }

  async increase_play_time(cart_id: string, play_time_ms: number) {
    const play_time_minutes = Math.floor(play_time_ms / (1_000 * 60));
    if (
      isNaN(play_time_minutes) ||
      play_time_minutes <= 0 ||
      !this.os.settings.get("play_habits").play_times
    ) {
      return;
    }

    await Db.PlayHabitsStore.transaction(this.os.db, "readwrite", async (store) => {
      const cart = await store.habits.get(cart_id);
      cart.play_time += play_time_minutes;
      await store.habits.put(cart);
    });
  }

  async track(process: Process) {
    await this.update_last_played(process.cartridge.id, new Date());
    const tracker = new PlayTimeTracker(this, process);
    tracker.start();
  }
}

export class PlayTimeTracker {
  readonly UPDATE_FREQUENCY = 1000 * 60 * 10; // every 10 minutes
  private _last_update;
  private _running = false;
  constructor(readonly habits: KatePlayHabits, readonly process: Process) {
    this._last_update = process.runtime;
  }

  start() {
    if (this._running) {
      throw new Error(`[kate:play-time] start() on a running tracker`);
    }
    this._running = true;
    this.process.on_system_event.listen(this.handle_heartbeat);
  }

  stop() {
    this.process.on_system_event.remove(this.handle_heartbeat);
  }

  handle_heartbeat = async (ev: SystemEvent) => {
    const elapsed = Math.floor(this.process.runtime - this._last_update);
    switch (ev.type) {
      case "heartbeat": {
        if (elapsed >= this.UPDATE_FREQUENCY) {
          this._last_update = this.process.runtime;
          await this.habits.increase_play_time(this.process.cartridge.id, elapsed);
        }
        break;
      }

      case "killed": {
        this._last_update = this.process.runtime;
        await this.habits.increase_play_time(this.process.cartridge.id, elapsed);
        this.stop();
        break;
      }
    }
  };
}
