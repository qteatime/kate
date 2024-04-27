/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { TC } from "../../utils";
import { handler } from "./handlers";

const log_level = TC.one_of(["debug", "trace", "info", "warn", "error"] as const);

export default [
  handler("kate:special.focus", TC.anything(), async () => {
    window.focus();
    return null;
  }),

  handler(
    "kate:special.log",
    TC.spec({ level: log_level, message: TC.str }),
    async (os, process, ipc, { level, message }) => {
      os.process_log.log(process.id, level, [message]);
    }
  ),
];
