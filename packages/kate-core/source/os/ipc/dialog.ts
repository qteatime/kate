/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
