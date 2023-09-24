/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { NotificationType } from "../os";
import { kate } from "./db";

export type Notification = {
  id?: number;
  type: NotificationType;
  process_id: string;
  time: Date;
  title: string;
  message: string;
};
export const notifications = kate.table1<Notification, "id">({
  since: 1,
  name: "notifications",
  path: "id",
  auto_increment: true,
});
