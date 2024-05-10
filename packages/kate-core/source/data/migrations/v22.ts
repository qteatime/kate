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

import { cart_meta_v3 } from "../cartridge";
import { kate } from "../db";

kate.data_migration({
  id: "v22/signature",
  description: "Migrating cartridges to a new format",
  since: 22,
  async process(db, os) {
    await db.transaction([cart_meta_v3], "readwrite", async (txn) => {
      const tcarts = txn.get_table1(cart_meta_v3);
      for (const cart of await tcarts.get_all()) {
        if (Array.isArray(cart.signatures)) {
          console.debug(`[kate:db] Skipping ${cart.id} (already migrated)`);
          continue;
        }

        console.debug(`[kate:db] Migrating ${cart.id}`);
        await tcarts.put({ ...cart, signatures: [] });
      }
    });
  },
});
