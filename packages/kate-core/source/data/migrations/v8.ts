import { kate } from "../db";
import { object_store_v1, object_store_v2 } from "../deprecated";

kate.data_migration({
  since: 8,
  description: "update object storage tables",
  process: async (db) => {
    await db.transaction(
      [object_store_v1, object_store_v2],
      "readwrite",
      async (t) => {
        const store_v1 = t.get_table2(object_store_v1);
        const store_v2 = t.get_table3(object_store_v2);
        const special_bucket = "kate:special";

        const entries = await store_v1.get_all();
        for (const entry of entries) {
          await store_v2.add({ ...entry, bucket_id: special_bucket });
        }

        await store_v1.clear();
      }
    );
  },
});
