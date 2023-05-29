import { cart_meta } from "../cartridge";
import { kate } from "../db";
import { play_habits } from "../play-habits";

kate.data_migration({
  id: 5,
  since: 10,
  description: "Mark installed cartridges as active",
  process: async (db) => {
    await db.transaction([cart_meta], "readwrite", async (t) => {
      const meta = t.get_table1(cart_meta);
      for (const cart of await meta.get_all()) {
        cart.status = "active";
        await meta.put(cart);
      }
    });
  },
});

kate.data_migration({
  id: 6,
  since: 10,
  description: "Store less fine-grained play times",
  process: async (db) => {
    await db.transaction([play_habits], "readwrite", async (t) => {
      const habits = t.get_table1(play_habits);
      for (const habit of await habits.get_all()) {
        habit.play_time = Math.floor(habit.play_time / (1_000 * 60));
        await habits.put(habit);
      }
    });
  },
});
