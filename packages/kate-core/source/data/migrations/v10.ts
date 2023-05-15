import { cart_meta } from "../cartridge";
import { kate } from "../db";

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
