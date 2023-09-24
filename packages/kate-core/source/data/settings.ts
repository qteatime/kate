/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { kate } from "./db";

export type Settings = {
  key: string;
  data: any;
  last_updated: Date | null;
};
export const settings = kate.table1<Settings, "key">({
  since: 7,
  name: "settings",
  path: "key",
  auto_increment: false,
});
