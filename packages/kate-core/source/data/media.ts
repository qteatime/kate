import { kate } from "./db";

export type Media = {
  id: string;
  cart_id: string;
  kind: "image" | "video";
  time: Date;
  thumbnail_dataurl: string;
  video_length: number | null;
  size: number;
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

export type MediaFile = {
  id: string;
  mime: string;
  data: Uint8Array;
};
export const media_files = kate.table1<MediaFile, "id">({
  since: 4,
  name: "media_files",
  path: "id",
  auto_increment: false,
});
