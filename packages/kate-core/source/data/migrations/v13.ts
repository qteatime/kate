/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { capability_grant } from "../capability";
import { cart_meta } from "../cartridge";
import { media_store } from "../media";
import { cartridge_quota, os_entry, os_partition } from "../object-storage";

capability_grant.index1({
  since: 12,
  deleted_since: 13,
  name: "by_cart",
  path: "cart_id",
  multi_entry: false,
  unique: false,
});

cart_meta.index1({
  since: 10,
  deleted_since: 13,
  name: "by_status",
  path: "status",
  multi_entry: false,
  unique: false,
});

media_store.index1({
  since: 3,
  deleted_since: 13,
  name: "by_cart",
  path: "cart_id",
  unique: false,
});

os_partition.index1({
  since: 9,
  deleted_since: 13,
  name: "by_cartridge",
  path: "cartridge_id",
  unique: false,
  multi_entry: false,
});

os_entry.index1<"unique_bucket_id">({
  since: 9,
  deleted_since: 13,
  name: "by_bucket",
  path: "unique_bucket_id",
  multi_entry: false,
  unique: false,
});

cartridge_quota.index1({
  since: 10,
  deleted_since: 13,
  name: "by_cartridge",
  path: "cartridge_id",
  multi_entry: false,
  unique: false,
});
