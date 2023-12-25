/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { kate } from "./db";

export type Media = {
  id: string;
  cart_id: string;
  kind: "image" | "video";
  time: Date;
  thumbnail_dataurl: string;
  video_length: number | null;
  size: number;
  // since v16
  file_id: string;
  mime: string;
};
export const media_store = kate.table1<Media, "id">({
  since: 4,
  name: "media_store_v2",
  path: "id",
  auto_increment: false,
});
export const idx_media_store_by_cart = media_store.index1({
  since: 13,
  name: "by_cart_v2",
  path: "cart_id",
  unique: false,
});
