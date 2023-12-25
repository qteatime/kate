/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart from "../../cart";
import { capability_grant } from "../capability";
import { CartridgeStatus } from "../cartridge";
import { kate } from "../db";
import { media_store } from "../media";
import { cartridge_quota, os_entry, os_partition } from "../object-storage";

// -- Cartridge
export type CartMeta_v2 = {
  id: string;
  version: string;
  release_date: Date;
  format_version: "v4";
  thumbnail_dataurl: string | null;
  banner_dataurl: string | null;
  metadata: Cart.Metadata;
  runtime: Cart.Runtime;
  security: Cart.Security;
  files: { path: string; id: string; size: number }[];
  installed_at: Date;
  updated_at: Date;
  status: CartridgeStatus;
};
export const cart_meta_v2 = kate.table1<CartMeta_v2, "id">({
  since: 3,
  deprecated_since: 15,
  name: "cart_meta_v2",
  path: "id",
  auto_increment: false,
});

export const idx_cart_by_status = cart_meta_v2.index1({
  since: 10,
  deleted_since: 13,
  name: "by_status",
  path: "status",
  multi_entry: false,
  unique: false,
});

export const idx_cart_by_status_v2 = cart_meta_v2.index1({
  since: 13,
  deprecated_since: 15,
  name: "by_status_v2",
  path: "status",
  multi_entry: false,
  unique: false,
});

export type CartFile = {
  id: string;
  file_id: string;
  mime: string;
  data: Uint8Array;
};
export const cart_files_v2 = kate.table2<CartFile, "id", "file_id">({
  since: 3,
  deprecated_since: 15,
  name: "cart_files_v2",
  path: ["id", "file_id"],
  auto_increment: false,
});

// -- Capability
export const idx_capability_by_cart = capability_grant.index1({
  since: 12,
  deleted_since: 13,
  name: "by_cart",
  path: "cart_id",
  multi_entry: false,
  unique: false,
});

// -- Media
export const idx_media_by_cart = media_store.index1({
  since: 3,
  deleted_since: 13,
  name: "by_cart",
  path: "cart_id",
  unique: false,
});

// -- Object store
export const idx_os_partition_by_cartridge = os_partition.index1({
  since: 9,
  deleted_since: 13,
  name: "by_cartridge",
  path: "cartridge_id",
  unique: false,
  multi_entry: false,
});

export const idx_os_entry_by_bucket = os_entry.index1<"unique_bucket_id">({
  since: 9,
  deleted_since: 13,
  name: "by_bucket",
  path: "unique_bucket_id",
  multi_entry: false,
  unique: false,
});

// -- Cartridge quota
export const idx_cartridge_quota_by_cartridge = cartridge_quota.index1({
  since: 10,
  deleted_since: 13,
  name: "by_cartridge",
  path: "cartridge_id",
  multi_entry: false,
  unique: false,
});
