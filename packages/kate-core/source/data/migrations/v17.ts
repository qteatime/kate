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
  id: "v17/cap-format",
  description: "Capability format change",
  since: 17,
  async process(db, os0) {
    await db.transaction([cart_meta_v3], "readwrite", async (txn) => {
      const cart = txn.get_table1(cart_meta_v3);
      for (const x of await cart.get_all()) {
        if (x.security.passive_capabilities == null) {
          x.security.passive_capabilities = [];
          cart.put(x);
          console.debug(`[db:migration] Patched ${x.id} capability metadata`);
        }
      }
    });
  },
});
