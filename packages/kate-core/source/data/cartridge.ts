import * as CartMetadata from "../cart/metadata";
import * as CartRuntime from "../cart/runtime";
import { kate } from "./db";

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
