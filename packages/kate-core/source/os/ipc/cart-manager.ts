/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { TC } from "../../utils";
import { EMessageFailed, auth_handler, handler } from "./handlers";
import * as Cart from "../../cart";
import * as UI from "../ui";
import type { BucketId, PartitionId } from "../apis";
import type { KateOS } from "../os";
import type { Process } from "../../kernel";

export async function install(os: KateOS, process: Process, file: Blob) {
  return await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
    if (os.kernel.console.options.mode === "single") {
      throw new EMessageFailed("kate.os.not-available", "Feature not available in single mode");
    }

    let cart;
    try {
      cart = await Cart.parse_metadata(file, os.kernel.version);
    } catch (e) {
      throw new EMessageFailed("kate.cart-manager.corrupted", "Corrupted cartridge");
    }

    const should_install = await os.dialog.confirm("kate:cart-manager", {
      title: "Install cartridge?",
      message: UI.stack([
        UI.paragraph([
          UI.strong([UI.mono_text([process.cartridge.id])]),
          " wants to install a cartridge:",
          UI.cartridge_chip(cart),
        ]),
      ]),
    });
    if (!should_install) {
      return null;
    }
    await os.cart_manager.install_from_file(file);
    return null;
  });
}

export default [
  auth_handler(
    "kate:cart-manager.install-from-file",
    TC.spec({ bucket_id: TC.str, file_id: TC.str }),
    { capabilities: [{ type: "install-cartridges" }] },
    async (os, process, ipc, { bucket_id, file_id }) => {
      const bucket_ref = await os.process_file_supervisor.get_ref(process.id, bucket_id);
      const kate_file = bucket_ref.bucket.file(file_id);
      const file = await kate_file.read();
      await install(os, process, file);
    }
  ),

  auth_handler(
    "kate:cart-manager.install-from-bytes",
    TC.spec({ cartridge: TC.bytearray }),
    { capabilities: [{ type: "install-cartridges" }] },
    async (os, process, ipc, { cartridge }) => {
      await install(os, process, new Blob([cartridge]));
    }
  ),
];
