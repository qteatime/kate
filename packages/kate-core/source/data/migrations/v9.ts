import { Range } from "../../db-schema";
import { make_id, mb } from "../../utils";
import { cart_meta } from "../cartridge";
import { kate } from "../db";
import {
  ObjectStorage,
  cartridge_quota,
  os_data,
  os_entry,
  os_partition,
} from "../object-storage";

kate.data_migration({
  id: 2,
  since: 9,
  description: "Update cartridge metadata to new format",
  process: async (db) => {
    await db.transaction([cart_meta], "readwrite", async (trans) => {
      const cartridges = trans.get_table1(cart_meta);
      for (const cartridge of await cartridges.get_all()) {
        const version = cartridge.metadata.release.version;
        cartridge.metadata.version_id = `${version.major}.${version.minor}`;
        await cartridges.put(cartridge);
      }
    });
  },
});

kate.data_migration({
  id: 3,
  since: 9,
  description: "Setup default stores and quotas for installed cartridges",
  process: async (db) => {
    await db.transaction(
      [cart_meta, ...ObjectStorage.tables],
      "readwrite",
      async (trans) => {
        const cartridges = await trans.get_table1(cart_meta).get_all();
        const tbuckets = trans.get_table3(os_partition);
        const tquota = trans.get_table2(cartridge_quota);
        for (const cartridge of cartridges) {
          tbuckets.add({
            cartridge_id: cartridge.id,
            version_id: cartridge.metadata.version_id,
            created_at: new Date(),
            bucket_name: "kate:special",
            unique_bucket_id: make_id(),
          });
          tbuckets.add({
            cartridge_id: cartridge.id,
            version_id: "<unversioned>",
            created_at: new Date(),
            bucket_name: "kate:special",
            unique_bucket_id: make_id(),
          });
          tquota.add({
            cartridge_id: cartridge.id,
            version_id: cartridge.metadata.version_id,
            current_buckets_in_storage: 1,
            current_items_in_storage: 0,
            current_size_in_bytes: 0,
            maximum_buckets_in_storage: 1_000,
            maximum_items_in_storage: 10_000,
            maximum_size_in_bytes: mb(64),
          });
          tquota.add({
            cartridge_id: cartridge.id,
            version_id: "<unversioned>",
            current_buckets_in_storage: 1,
            current_items_in_storage: 0,
            current_size_in_bytes: 0,
            maximum_buckets_in_storage: 1_000,
            maximum_items_in_storage: 10_000,
            maximum_size_in_bytes: mb(64),
          });
        }
      }
    );
  },
});

kate.data_migration({
  id: 4,
  since: 9,
  description: "Fix special storage buckets",
  process: async (db) => {
    await db.transaction(ObjectStorage.tables, "readwrite", async (trans) => {
      const tbuckets = trans.get_table3(os_partition);
      for (const bucket of await tbuckets.get_all()) {
        if (bucket.unique_bucket_id === "kate:special") {
          bucket.unique_bucket_id = make_id();
          await tbuckets.put(bucket);
        }
      }

      const tentries = trans.get_table2(os_entry);
      const tdata = trans.get_table2(os_data);
      for (const entry of await tentries.get_all(
        Range.from(["kate:special", ""])
      )) {
        await tentries.delete(["kate:special", entry.key]);
        await tdata.delete(["kate:special", entry.key]);
      }
    });
  },
});