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
