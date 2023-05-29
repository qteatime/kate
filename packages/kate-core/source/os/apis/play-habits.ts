import * as Db from "../../data";
import type { KateOS } from "../os";

export class KatePlayHabits {
  constructor(readonly os: KateOS) {}

  async try_get(cart: string) {
    return await Db.PlayHabitsStore.transaction(
      this.os.db,
      "readonly",
      async (store) => {
        return store.habits.try_get(cart);
      }
    );
  }

  async try_get_all(carts: string[]): Promise<Map<string, Db.PlayHabits>> {
    return await Db.PlayHabitsStore.transaction(
      this.os.db,
      "readonly",
      async (store) => {
        const results = new Map<string, Db.PlayHabits>();
        for (const cart of carts) {
          const habits = await store.habits.try_get(cart);
          if (habits != null) {
            results.set(cart, habits);
          }
        }
        return results;
      }
    );
  }

  async all_in_database() {
    return await Db.PlayHabitsStore.transaction(
      this.os.db,
      "readonly",
      async (store) => {
        return store.habits.get_all();
      }
    );
  }

  async remove_all() {
    await Db.PlayHabitsStore.transaction(
      this.os.db,
      "readwrite",
      async (store) => {
        await store.reset_all();
      }
    );
  }

  async remove_one(id: string, remove: boolean) {
    await Db.PlayHabitsStore.transaction(
      this.os.db,
      "readwrite",
      async (store) => {
        if (remove) {
          store.remove(id);
        } else {
          store.reset(id);
        }
      }
    );
  }

  async update_last_played(cart_id: string, last_played: Date | null) {
    if (!this.os.settings.get("play_habits").recently_played) {
      return;
    }

    await Db.PlayHabitsStore.transaction(
      this.os.db,
      "readwrite",
      async (store) => {
        const cart = await store.habits.get(cart_id);
        cart.last_played = last_played;
        await store.habits.put(cart);
      }
    );
  }

  async increase_play_time(cart_id: string, play_time_ms: number) {
    const play_time_minutes = Math.floor(play_time_ms / (1_000 * 60));
    if (!this.os.settings.get("play_habits").play_times) {
      return;
    }

    await Db.PlayHabitsStore.transaction(
      this.os.db,
      "readwrite",
      async (store) => {
        const cart = await store.habits.get(cart_id);
        cart.play_time += play_time_minutes || 0;
        await store.habits.put(cart);
      }
    );
  }
}
