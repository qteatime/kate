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
