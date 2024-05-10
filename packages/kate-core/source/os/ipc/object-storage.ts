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

import type { CartridgeQuota, OSEntry } from "../../data";
import type { CartridgeBucket } from "../apis";
import { TC } from "../../utils";
import { handler } from "./handlers";

export const public_repr = {
  bucket: (x: CartridgeBucket) => {
    return {
      name: x.bucket.bucket_name,
      created_at: x.bucket.created_at,
    };
  },

  storage_entry: (x: OSEntry) => {
    return {
      key: x.key,
      created_at: x.created_at,
      updated_at: x.updated_at,
      type: x.type,
      size: x.size,
      metadata: x.metadata,
    };
  },

  storage_entry_with_data: (x: OSEntry & { data: unknown }) => {
    return {
      key: x.key,
      created_at: x.created_at,
      updated_at: x.updated_at,
      type: x.type,
      size: x.size,
      metadata: x.metadata,
      data: x.data,
    };
  },

  storage_usage: (x: CartridgeQuota) => {
    return {
      limits: {
        size_in_bytes: x.maximum_size_in_bytes,
        buckets: x.maximum_buckets_in_storage,
        entries: x.maximum_items_in_storage,
      },
      usage: {
        size_in_bytes: x.current_size_in_bytes,
        buckets: x.current_buckets_in_storage,
        entries: x.current_items_in_storage,
      },
    };
  },
};

export const bucket_name = TC.short_str(255);

export default [
  handler(
    "kate:store.list-buckets",
    TC.spec({ versioned: TC.bool, count: TC.optional(undefined, TC.int) }),
    async (os, process, ipc, { versioned, count }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const buckets = await store.list_buckets(count);
      return buckets.map(public_repr.bucket);
    }
  ),

  handler(
    "kate:store.add-bucket",
    TC.spec({ versioned: TC.bool, name: bucket_name }),
    async (os, process, ipc, { versioned, name }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      await store.add_bucket(name);
      return null;
    }
  ),

  handler(
    "kate:store.ensure-bucket",
    TC.spec({ versioned: TC.bool, name: bucket_name }),
    async (os, process, ipc, { versioned, name }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      await store.ensure_bucket(name);
      return null;
    }
  ),

  handler(
    "kate:store.delete-bucket",
    TC.spec({ versioned: TC.bool, name: bucket_name }),
    async (os, process, ipc, { versioned, name }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const bucket = await store.get_bucket(name);
      await bucket.delete_bucket();
      return null;
    }
  ),

  handler(
    "kate:store.count-entries",
    TC.spec({
      versioned: TC.bool,
      bucket_name: bucket_name,
    }),
    async (os, process, ipc, { versioned, bucket_name }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const bucket = await store.get_bucket(bucket_name);
      return await bucket.count();
    }
  ),

  handler(
    "kate:store.list-entries",
    TC.spec({
      versioned: TC.bool,
      bucket_name,
      count: TC.optional(undefined, TC.int),
    }),
    async (os, process, ipc, { versioned, bucket_name, count }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const bucket = await store.get_bucket(bucket_name);
      const entries = await bucket.list_metadata(count);
      return entries.map(public_repr.storage_entry);
    }
  ),

  handler(
    "kate:store.read",
    TC.spec({
      versioned: TC.bool,
      bucket_name,
      key: TC.str,
    }),
    async (os, process, ipc, { versioned, bucket_name, key }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const bucket = await store.get_bucket(bucket_name);
      const entry = await bucket.read(key);
      return public_repr.storage_entry_with_data(entry);
    }
  ),

  handler(
    "kate:store.try-read",
    TC.spec({
      versioned: TC.bool,
      bucket_name,
      key: TC.str,
    }),
    async (os, process, ipc, { versioned, bucket_name, key }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const bucket = await store.get_bucket(bucket_name);
      const entry = await bucket.try_read(key);
      return entry == null ? null : public_repr.storage_entry_with_data(entry);
    }
  ),

  handler(
    "kate:store.write",
    TC.spec({
      versioned: TC.bool,
      bucket_name,
      key: TC.str,
      type: TC.str,
      metadata: TC.dictionary(TC.anything()),
      data: TC.anything(),
    }),
    async (os, process, ipc, { versioned, bucket_name, key, type, metadata, data }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const bucket = await store.get_bucket(bucket_name);
      await bucket.write(key, {
        type: type,
        metadata: metadata,
        data: data,
      });
      return null;
    }
  ),

  handler(
    "kate:store.create",
    TC.spec({
      versioned: TC.bool,
      bucket_name,
      key: TC.str,
      type: TC.str,
      metadata: TC.dictionary(TC.anything()),
      data: TC.anything(),
    }),
    async (os, process, ipc, { versioned, bucket_name, key, type, metadata, data }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const bucket = await store.get_bucket(bucket_name);
      await bucket.create(key, {
        type: type,
        metadata: metadata,
        data: data,
      });
      return null;
    }
  ),

  handler(
    "kate:store.delete",
    TC.spec({
      versioned: TC.bool,
      bucket_name,
      key: TC.str,
    }),
    async (os, process, ipc, { versioned, bucket_name, key }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const bucket = await store.get_bucket(bucket_name);
      await bucket.delete(key);
      return null;
    }
  ),

  handler(
    "kate:store.usage",
    TC.spec({
      versioned: TC.bool,
    }),
    async (os, process, ipc, { versioned }) => {
      const store = os.object_store.cartridge(process.cartridge, versioned);
      const usage = await store.usage();
      return public_repr.storage_usage(usage);
    }
  ),
];
