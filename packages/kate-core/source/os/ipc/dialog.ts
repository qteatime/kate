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

import { TC } from "../../utils";
import { EMessageFailed, auth_handler, handler } from "./handlers";

export default [
  auth_handler(
    "kate:dialog.text-input",
    TC.spec({
      type: TC.one_of(["text", "password"] as const),
      initial_value: TC.optional("", TC.str),
      message: TC.short_str(255),
      placeholder: TC.optional("", TC.str),
      max_length: TC.optional(undefined, TC.int),
    }),
    { fail_silently: true, capabilities: [{ type: "show-dialogs" }] },
    async (os, process, ipc, { type, message, initial_value, placeholder, max_length }) => {
      return await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
        const result = await os.dialog.text_input(process.cartridge.id, message, {
          max_length: max_length ?? undefined,
          type: type,
          initial_value,
          placeholder,
        });
        return result;
      });
    }
  ),

  auth_handler(
    "kate:dialog.message",
    TC.spec({ message: TC.str }),
    { fail_silently: true, capabilities: [{ type: "show-dialogs" }] },
    async (os, process, ipc, { message }) => {
      return await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
        await os.dialog.message(process.cartridge.id, { title: "", message });
        return null;
      });
    }
  ),
];
