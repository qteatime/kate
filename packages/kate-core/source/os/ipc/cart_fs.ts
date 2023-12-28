/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EMessageFailed, WithTransfer, handler } from "./handlers";
import { TC } from "../../utils";

export default [
  handler("kate:cart.read-file", TC.spec({ path: TC.str }), async (os, process, ipc, { path }) => {
    try {
      const file = await process.file_system.read(path);
      return new WithTransfer({ mime: file.mime, bytes: file.data }, [file.data.buffer]);
    } catch (error) {
      console.error(`[Kate] failed to read file ${path} from ${process.cartridge.id}`);
      throw new EMessageFailed("kate.cart-fs.file-not-found", `Failed to read file ${path}`);
    }
  }),
];
