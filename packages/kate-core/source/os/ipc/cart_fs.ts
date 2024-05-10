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
