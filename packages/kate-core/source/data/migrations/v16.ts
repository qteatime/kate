/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import { kate } from "../db";
import type { KateOS } from "../../os";
import { media_store, type Media } from "../media";
import { media_files } from "./deprecated";

type OldMedia = Omit<Media, "file_id" | "mime">;

// -- Migrations
kate.data_migration({
  id: "v16/media",
  description: "Migrating media files to new storage",
  since: 16,
  async process(db, os0) {
    const os = os0 as KateOS;
    const store = os.file_store;
    const bucket = await store.get_kernel_bucket("media");
    const mapping = new Map<string, { mime: string; id: string }>();

    // -- First copy all files to the backing file storage
    try {
      const files: OldMedia[] = await db.transaction([media_store], "readonly", async (txn) => {
        return txn.get_table1(media_store).get_all();
      });
      console.debug(`[kate:db] Moving ${files.length} media files to new storage format`);
      for (const file of files) {
        const data = await db.transaction([media_files], "readonly", async (txn) => {
          return txn.get_table1(media_files).get(file.id);
        });
        const entry = await bucket.put(data.data);
        mapping.set(file.id, { mime: data.mime, id: entry.id });
      }
    } catch (e) {
      for (const entry of mapping.values()) {
        await bucket.file(entry.id).delete();
      }
      console.error("[kate:db] Failed to migrate media files", e);
      throw new Error(`[kate:db] Failed to migrate media files ${e}`);
    }

    // -- Patch all media entries
    await db.transaction([media_store, media_files], "readwrite", async (txn) => {
      const media = txn.get_table1(media_store);
      const files = txn.get_table1(media_files);

      console.debug(`[kate:db] Patching media entries to point to new storage`);
      for (const entry of await media.get_all()) {
        const mapped_file = mapping.get(entry.id);
        if (mapped_file == null) {
          throw new Error(`[kate:db] Inconsistent media database`);
        }

        media.put({
          ...entry,
          file_id: mapped_file.id,
          mime: mapped_file.mime,
        });
      }

      console.debug(`[kate:db] Cleaning up old tables`);
      await files.clear();
    });
  },
});
