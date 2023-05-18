import { Database, Transaction } from "../db-schema";
import { kate } from "./db";

export type PlayHabits = {
  id: string;
  last_played: Date | null;
  play_time: number;
};
export const play_habits = kate.table1<PlayHabits, "id">({
  since: 5,
  name: "play_habits",
  path: "id",
  auto_increment: false,
});

export class PlayHabitsStore {
  constructor(readonly transaction: Transaction) {}

  static transaction<A>(
    db: Database,
    mode: IDBTransactionMode,
    fn: (store: PlayHabitsStore) => Promise<A>
  ) {
    return db.transaction(PlayHabitsStore.tables, mode, async (txn) => {
      return await fn(new PlayHabitsStore(txn));
    });
  }

  static tables = [play_habits];

  get habits() {
    return this.transaction.get_table1(play_habits);
  }

  async remove(cart_id: string) {
    await this.habits.delete(cart_id);
  }

  async reset(cart_id: string) {
    await this.habits.put({
      id: cart_id,
      last_played: null,
      play_time: 0,
    });
  }

  async reset_all() {
    for (const habit of await this.habits.get_all()) {
      await this.reset(habit.id);
    }
  }

  async initialise(cart_id: string) {
    const old_habits = await this.habits.try_get(cart_id);
    if (old_habits == null) {
      await this.habits.add({
        id: cart_id,
        last_played: null,
        play_time: 0,
      });
    }
  }
}
