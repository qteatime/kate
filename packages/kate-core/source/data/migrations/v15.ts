/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { cart_meta_v3, CartridgeStatus } from "../cartridge";
import { kate } from "../db";
import { KateFileStore, PersistentKey } from "../../os/apis/file-store";
import { cart_files_v2, cart_meta_v2 } from "./deprecated";
import type { KateOS } from "../../os";

type CartId = string;
type Path = string;
type Node = { mime: string; integrity: Uint8Array; id: string };
type Files = {
  key: PersistentKey;
  nodes: Map<Path, Node>;
};

// -- Migrations
kate.data_migration({
  id: "v15/files",
  description: "Migrating cartridge files to new format",
  since: 15,
  async process(db, os) {
    const store = (os as KateOS).file_store;
    const partition = await store.get_partition("cartridge");
    const buckets = new Map<CartId, Files>();

    // -- First store all files in the backing file storage
    const cartridges = await db.transaction([cart_meta_v2], "readonly", async (txn) => {
      const cv2 = txn.get_table1(cart_meta_v2);
      return cv2.get_all();
    });
    for (const cartridge of cartridges) {
      if (cartridge.status !== "active") {
        console.debug(`[kate:db] Skipping archived cartridge's files ${cartridge.id}`);
        continue;
      }
      console.debug(`[kate:db] Migrating files for ${cartridge.id} ${cartridge.version}`);
      const bucket = await partition.create(null);
      try {
        const nodes = new Map<string, Node>();
        for (const file of cartridge.files) {
          const data = await db.transaction([cart_files_v2], "readonly", async (txn) => {
            return txn.get_table2(cart_files_v2).get([cartridge.id, file.id]);
          });
          const integrity = new Uint8Array(await crypto.subtle.digest("SHA-256", data.data));
          const handle = await bucket.put(data.data);
          nodes.set(file.path, { mime: data.mime, integrity, id: handle.id });
        }
        buckets.set(cartridge.id, {
          key: await partition.persist(bucket, {
            type: "cartridge",
            id: cartridge.id,
            version: cartridge.version,
          }),
          nodes,
        });
      } finally {
        partition.release(bucket);
      }
    }

    // -- Then migrate table records and erase the existing ones
    await db.transaction([cart_meta_v2, cart_meta_v3, cart_files_v2], "readwrite", async (txn) => {
      const cv2 = txn.get_table1(cart_meta_v2);
      const cv3 = txn.get_table1(cart_meta_v3);
      const files = txn.get_table2(cart_files_v2);

      for (const cartridge of await cv2.get_all()) {
        if (cartridge.status === "active") {
          console.debug(
            `[kate:db] Migrating active cartridge metadata ${cartridge.id} ${cartridge.version}`
          );
          const { key, nodes } = buckets.get(cartridge.id)!;
          await cv3.add({
            ...cartridge,
            minimum_kate_version: { major: 0, minor: 24, patch: 2 },
            bucket_key: key,
            files: cartridge.files.map((x) => {
              const { id, mime, integrity } = nodes.get(x.path)!;
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
          console.debug(
            `[kate:db] Migrating archived cartridge ${cartridge.id} ${cartridge.version}`
          );
          await cv3.add({
            ...cartridge,
            minimum_kate_version: { major: 0, minor: 24, patch: 2 },
            bucket_key: null,
            files: [],
          });
        }
      }

      console.debug(`[kate:db] Cleaning up old tables`);
      await cv2.clear();
      await files.clear();
    });
  },
});
