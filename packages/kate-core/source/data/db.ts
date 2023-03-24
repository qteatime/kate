import * as Db from "../../../db-schema/build";
import type { NotificationType } from "../os/apis/notification";

export const kate = new Db.DatabaseSchema("kate", 2);
export const cart_meta = kate.table<{
  id: string;
  title: string;
  description: string;
  thumbnail: {
    mime: string;
    bytes: Uint8Array;
  } | null;
  installed_at: Date;
}>(1, "cart_meta", { path: "id", auto_increment: false });

export const cart_files = kate.table<{
  id: string;
  bytes: Uint8Array;
}>(1, "cart_files", { path: "id", auto_increment: false });

export const notifications = kate.table<{
  id?: number;
  type: NotificationType;
  process_id: string;
  time: Date;
  title: string;
  message: string;
}>(1, "notifications", { path: "id", auto_increment: true });

export const cart_kvstore = kate.table<{
  id: string;
  content: { [key: string]: string };
}>(1, "cart_kvstore", { path: "id", auto_increment: false });

export const media_store = kate.table<{
  id?: number;
  cart_id: string;
  mime: string;
  file: FileSystemFileHandle;
  time: Date;
}>(2, "media_store", { path: "id", auto_increment: true }, (s) =>
  s.add("cart_id", ["cart_id"], { unique: false, multiple: false })
);
