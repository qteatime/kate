import { kate } from "./db";

export type QuotaUsage_v1 = {
  cart_id: string;
  available: number;
  used: number;
};
export const quota_usage_v1 = kate.table1<QuotaUsage_v1, "cart_id">({
  since: 6,
  name: "quota_usage",
  path: "cart_id",
  auto_increment: false,
});

export type ObjectStore_v1 = {
  cart_id: string;
  id: string;
  size: number;
  data: unknown;
};
export const object_store_v1 = kate.table2<ObjectStore_v1, "cart_id", "id">({
  since: 6,
  name: "object_store",
  path: ["cart_id", "id"],
  auto_increment: false,
  deprecated_since: 8,
});

export type ObjectStore_v2 = {
  cart_id: string;
  bucket_id: string;
  id: string;
  size: number;
  data: unknown;
};
export const object_store_v2 = kate.table3<
  ObjectStore_v2,
  "cart_id",
  "bucket_id",
  "id"
>({
  since: 8,
  name: "object_store_v2",
  path: ["cart_id", "bucket_id", "id"],
  auto_increment: false,
});
export const idx_cart_object_store_by_cart_v1 = object_store_v2.index1({
  since: 8,
  name: "by_cart",
  path: ["cart_id"],
  unique: false,
});
export const idx_cart_object_store_by_bucket_v1 = object_store_v2.index2({
  since: 8,
  name: "by_bucket",
  path: ["cart_id", "bucket_id"],
  unique: true,
});
