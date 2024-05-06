/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
