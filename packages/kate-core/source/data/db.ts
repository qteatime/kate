import * as Db from "../db-schema";
import * as CartMetadata from "../cart/metadata";
import * as CartRuntime from "../cart/runtime";
import type { NotificationType } from "../os/apis/notification";

export const kate = new Db.DatabaseSchema("kate", 3);

// Table definitions
export type CartMeta = {
  id: string;
  thumbnail_dataurl: string;
  metadata: CartMetadata.Metadata;
  runtime: CartRuntime.Runtime;
  files: { path: string; id: string; size: number }[];
  installed_at: Date;
  updated_at: Date;
  last_played: Date | null;
  play_time: number;
};
export const cart_meta = kate.table1<CartMeta, "id">({
  since: 3,
  name: "cart_meta_v2",
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
  id?: number;
  cart_id: string;
  mime: string;
  file: FileSystemFileHandle;
  time: Date;
  thumbnail: string; // As data URL
  video_length: number | null;
};
export const media_store = kate.table1<Media, "id">({
  since: 2,
  name: "media_store",
  path: "id",
  auto_increment: true,
});
export const idx_media_store_by_cart = media_store.index1({
  since: 3,
  name: "by_cart",
  path: ["cart_id"],
  unique: false,
  multi_entry: false,
});

// Data migrations
