/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { TC } from "../../utils";
import { handler } from "./handlers";

export default [
  handler("kate:special.focus", TC.anything(), async () => {
    window.focus();
    return null;
  }),
];
