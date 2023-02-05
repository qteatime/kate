import * as Db from "../../db";
import type { NotificationType } from "./notification";

export const kate = new Db.DatabaseSchema("kate", 1);
export const cart_meta = kate.table<{
  id: string,
  title: string,
  description: string,
  thumbnail: {
    mime: string,
    bytes: Uint8Array
  } | null,
  installed_at: Date
}>(1, "cart_meta", {path: "id", auto_increment: false}, []);

export const cart_files = kate.table<{
  id: string,
  bytes: Uint8Array
}>(1, "cart_files", {path: "id", auto_increment: false}, []);

export const notifications = kate.table<{
  id?: number,
  type: NotificationType,
  process_id: string,
  time: Date,
  title: string,
  message: string
}>(1, "notifications", {path: "id", auto_increment: true}, []);

export const cart_kvstore = kate.table<{
  id: string,
  content: {[key: string]: string}
}>(1, "cart_kvstore", {path: "id", auto_increment: false}, []);