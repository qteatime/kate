import { mb } from "../../utils";
import { cart_meta } from "../cartridge";
import { kate } from "../db";
import {
  ObjectStorage,
  cartridge_quota,
  os_partition,
} from "../object-storage";

kate.data_migration({
  since: 9,
  description: "Give installed cartridges default stores and quotas",
  process: async (db) => {
    await db.transaction(
      [cart_meta, ...ObjectStorage.tables],
      "readwrite",
      async (trans) => {
        const cartridges = await trans.get_table1(cart_meta).get_all();
        const tbuckets = trans.get_table3(os_partition);
        const tquota = trans.get_table2(cartridge_quota);
        for (const cartridge of cartridges) {
          const meta_version = cartridge.metadata.release.version;
          const version_id = `${meta_version.major}.${meta_version.minor}`;
          tbuckets.add({
            cartridge_id: cartridge.id,
            version_id: version_id,
            created_at: new Date(),
            bucket_name: "kate:special",
            unique_bucket_id: "kate:special",
          });
          tquota.add({
            cartridge_id: cartridge.id,
            version_id: version_id,
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
