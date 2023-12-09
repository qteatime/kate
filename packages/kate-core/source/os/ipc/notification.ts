/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { TC } from "../../utils";
import { handler } from "./handlers";

export default [
  handler(
    "kate:notify.transient",
    TC.spec({
      title: TC.str,
      message: TC.str,
    }),
    async (os, process, ipc, { title, message }) => {
      await os.notifications.push_transient(process.cartridge.id, title, message);
      return null;
    }
  ),
];
