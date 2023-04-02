import * as Db from "../db-schema";
import * as CartMetadata from "../cart/metadata";
import * as CartRuntime from "../cart/runtime";
import type { NotificationType } from "../os/apis/notification";

export const kate = new Db.DatabaseSchema("kate", 5);

// Table definitions
export type CartMeta = {
  id: string;
  thumbnail_dataurl: string;
  metadata: CartMetadata.Metadata;
  runtime: CartRuntime.Runtime;
  files: { path: string; id: string; size: number }[];
  installed_at: Date;
  updated_at: Date;
};
export const cart_meta = kate.table1<CartMeta, "id">({
  since: 3,
  name: "cart_meta_v2",
  path: "id",
  auto_increment: false,
});

export type PlayHabits = {
  id: string;
  last_played: Date | null;
  play_time: number;
};
export const play_habits = kate.table1<PlayHabits, "id">({
  since: 5,
  name: "play_habits",
  path: "id",
  auto_increment: false,
});

export type CartFile = {
  id: string;
  file_id: string;
  mime: string;
  data: Uint8Array;
};
export const cart_files = kate.table2<CartFile, "id", "file_id">({
  since: 3,
  name: "cart_files_v2",
  path: ["id", "file_id"],
  auto_increment: false,
});

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

export type KeyValue = {
  id: string;
  content: { [key: string]: string };
};
export const cart_kvstore = kate.table1<KeyValue, "id">({
  since: 1,
  name: "cart_kvstore",
  path: "id",
  auto_increment: false,
});

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
  since: 3,
  name: "by_cart",
  path: ["cart_id"],
  unique: false,
  multi_entry: false,
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

// Data migrations
