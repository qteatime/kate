import { make_id } from "../../utils";
import { cart_files, cart_meta } from "../cartridge";
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

kate.data_migration({
  id: 7,
  since: 10,
  description: "Update database for cartridge format changes",
  process: async (db) => {
    await db.transaction([cart_meta, cart_files], "readwrite", async (t) => {
      const meta = t.get_table1(cart_meta);
      const files = t.get_table2(cart_files);
      const text_encoder = new TextEncoder();
      for (const cart of await meta.get_all()) {
        if (cart.runtime.html !== "kate:index") {
          const id = make_id();
          const data = text_encoder.encode(cart.runtime.html);
          await files.put({
            id: cart.metadata.id,
            file_id: id,
            mime: "text/html",
            data: data,
          });
          cart.files.push({
            path: "kate:index",
            id: id,
            size: data.byteLength,
          });
          cart.runtime.html = "kate:index";
        }
        if (cart.metadata.release.legal_notices !== "kate:licence") {
          const id = make_id();
          const data = text_encoder.encode(cart.metadata.release.legal_notices);
          await files.put({
            id: cart.metadata.id,
            file_id: id,
            mime: "text/html",
            data: data,
          });
          cart.files.push({
            path: "kate:licence",
            id: id,
            size: data.byteLength,
          });
          cart.metadata.release.legal_notices = "kate:licence";
        }
        await meta.put(cart);
      }
    });
  },
});
