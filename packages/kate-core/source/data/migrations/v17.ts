/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { cart_meta_v3, cart_meta_v2, cart_files } from "../cartridge";
import { kate } from "../db";
import { KateFileStore } from "../../os/apis/file-store";

kate.data_migration({
  id: "v15/files",
  description: "Migrating cartridge files to new format",
  since: 15,
  async process(db) {
    const store = new KateFileStore();
    const partition = await store.get_partition("cartridge");

    await db.transaction([cart_meta_v2, cart_meta_v3, cart_files], "readwrite", async (txn) => {
      const cv2 = txn.get_table1(cart_meta_v2);
      const cv3 = txn.get_table1(cart_meta_v3);
      const files = txn.get_table2(cart_files);

      for (const cartridge of await cv2.get_all()) {
        if (cartridge.status === "active") {
          const mapping = new Map<string, { id: string; mime: string; integrity: Uint8Array }>();
          const bucket = await partition.create();
          for (const node of cartridge.files) {
            const file = await files.get([cartridge.id, node.id]);
            const bucket_entry = await bucket.put(file.data);
            const integrity = await crypto.subtle.digest("SHA-256", file.data.buffer);
            mapping.set(node.path, {
              id: bucket_entry.id,
              mime: file.mime,
              integrity: new Uint8Array(integrity),
            });
          }
          const persist_key = await partition.persist(bucket, {
            type: "cartridge",
            id: cartridge.id,
            version: cartridge.version,
          });
          await cv3.add({
            ...cartridge,
            minimum_kate_version: { major: 0, minor: 24, patch: 2 },
            bucket_key: persist_key,
            files: cartridge.files.map((x) => {
              const { id, mime, integrity } = mapping.get(x.path)!;
              return {
                id: id,
                integrity_hash: integrity,
                integrity_hash_algorithm: "SHA-256",
                mime,
                path: x.path,
                size: x.size,
              };
            }),
          });
        } else {
          await cv3.add({
            ...cartridge,
            minimum_kate_version: { major: 0, minor: 24, patch: 2 },
            bucket_key: null,
            files: [],
          });
        }
      }

      await cv2.clear();
      await files.clear();
    });
  },
});
