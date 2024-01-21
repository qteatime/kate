/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
