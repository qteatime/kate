/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart from "../../cart";
import * as Capability from "../../capabilities";
import type { KateOS } from "../os";
import * as Db from "../../data";
import {
  from_bytes,
  gb,
  make_thumbnail_from_bytes,
  map,
  readable_stream_from_iterable,
  serialise_error,
  zip,
} from "../../utils";
import { KateFileBucket } from "./file-store";
import { ECartCorrupted, ECartFormatTooNew, ENoCartParser } from "../../error";

export class CartManager {
  readonly THUMBNAIL_WIDTH = 400;
  readonly THUMBNAIL_HEIGHT = 700;
  readonly BANNER_WIDTH = 1280;
  readonly BANNER_HEIGHT = 200;

  constructor(readonly os: KateOS) {}

  async list_all() {
    return await Db.CartStore.transaction(this.os.db, "meta", "readonly", async (store) => {
      return store.list();
    });
  }

  async list_by_status(status?: Db.CartridgeStatus): Promise<Db.CartMeta_v3[]> {
    return await Db.CartStore.transaction(this.os.db, "meta", "readonly", async (store) => {
      return store.list_by_status(status);
    });
  }

  // -- Retrieval
  private async get_bucket_and_meta(cart_id: string) {
    const meta = await this.read_metadata(cart_id);
    if (meta.bucket_key == null) {
      throw new Error(`[kate:cart-manager] Cannot read files in an archived cartridge`);
    }
    const { partition, bucket } = await this.os.file_store.from_key(meta.bucket_key);
    return { partition, bucket, meta };
  }

  async read_files_by_cart(cart_id: string) {
    const { partition, bucket, meta } = await this.get_bucket_and_meta(cart_id);
    try {
      const nodes = await Promise.all(
        meta.files.map(async (x) => [x.path, await bucket.file(x.id).read()] as const)
      );
      return new Map(nodes);
    } finally {
      partition.release(bucket);
    }
  }

  async read_file_by_path(cart_id: string, path: string): Promise<Cart.DataFile> {
    const { partition, bucket, meta } = await this.get_bucket_and_meta(cart_id);
    try {
      const node = meta.files.find((x) => x.path === path);
      if (node == null) {
        throw new Error(`[kate:cart-manager] File not found ${cart_id} :: ${path}`);
      }
      const handle = await bucket.file(node.id).read();
      return {
        path: node.path,
        mime: node.mime,
        integrity_hash: node.integrity_hash,
        integrity_hash_algorithm: node.integrity_hash_algorithm,
        size: node.size,
        data: new Uint8Array(await handle.arrayBuffer()),
      };
    } finally {
      partition.release(bucket);
    }
  }

  async read_file_by_id(cart_id: string, file_id: string): Promise<Cart.DataFile> {
    const { partition, bucket, meta } = await this.get_bucket_and_meta(cart_id);
    try {
      const node = meta.files.find((x) => x.id === file_id);
      if (node == null) {
        throw new Error(`[kate:cart-manager] File not found ${cart_id} :: ${file_id}`);
      }
      const handle = await bucket.file(node.id).read();
      return {
        ...node,
        data: new Uint8Array(await handle.arrayBuffer()),
      };
    } finally {
      partition.release(bucket);
    }
  }

  async try_read_metadata(cart_id: string) {
    return await Db.CartStore.transaction(this.os.db, "meta", "readonly", async (store) => {
      return store.meta.try_get(cart_id);
    });
  }

  async read_metadata(cart_id: string) {
    const metadata = await this.try_read_metadata(cart_id);
    if (metadata == null) {
      throw new Error(`Cartridge not found: ${cart_id}`);
    }
    return metadata;
  }

  // -- Installation
  async install_from_file(file: File | Blob) {
    const estimated_unpacked_size = file.size + this.os.object_store.default_quota.maximum_size * 2;
    if (!(await this.os.storage_manager.can_fit(estimated_unpacked_size))) {
      this.os.notifications.push_transient(
        "kate:cart-manager",
        "Installation failed",
        `${file.name} (${from_bytes(estimated_unpacked_size)}) exceeds the storage capacity.`
      );
      return;
    }

    try {
      const parser = await Cart.choose_parser(file);
      if (parser == null) {
        throw new ENoCartParser(file.name);
      }
      const header = await parser.parse_header(file);
      await this.assert_minimum_version(file.name, header, parser);
      const metadata = await parser.parse_meta(file, header);
      const files = parser.parse_files(file, header, metadata);
      const errors = await Cart.verify_pointers(metadata);
      if (errors.length !== 0) {
        console.error(`Corrupted cartridge ${metadata.id}`, errors);
        throw new Error(`Corrupted cartridge ${metadata.id}`);
      }
      await this.install(metadata, files);
    } catch (error) {
      console.error(`Failed to install ${file.name}:`, error);
      await this.os.audit_supervisor.log("kate:cart-manager", {
        resources: ["kate:storage", "error"],
        risk: "high",
        type: "kate.storage.installation-failed",
        message: `Failed to install ${file.name}`,
        extra: { error: serialise_error(error) },
      });
      await this.os.notifications.push_transient(
        "kate:cart-manager",
        "Installation failed",
        `${file.name} could not be installed.`
      );
    }
  }

  private async assert_minimum_version(
    name: string,
    header: unknown,
    parser: Cart.Parser<unknown>
  ) {
    const required = parser.minimum_version(header);
    if (this.os.kernel.version.lt(required)) {
      throw new ECartFormatTooNew(required, name);
    }
  }

  async install(cart: Cart.DataCart, files: AsyncIterable<{ index: number; data: Uint8Array }>) {
    if (this.os.kernel.console.options.mode === "single") {
      throw new Error(`Cartridge installation is not available in single mode.`);
    }

    const old_meta = await this.try_read_metadata(cart.id);
    if (old_meta != null) {
      const version = cart.version;
      const title = cart.metadata.presentation.title;
      const old_title = old_meta.metadata.presentation.title;
      const old_version = old_meta.version;
      if (old_meta.status === "active") {
        if (old_version === version && !this.os.settings.get("developer").allow_version_overwrite) {
          await this.os.notifications.push_transient(
            "kate:cart-manager",
            `Cartridge not installed`,
            `${title} (${cart.id}) is already installed at version v${old_version}`
          );
          return false;
        } else {
          const should_update = await this.os.dialog.confirm("kate:installer", {
            title: `Update ${old_title}?`,
            message: `A cartridge already exists for ${cart.id} (${old_title} v${old_version}).
                      Update it to ${title} v${version}?`,
            ok: "Update",
            cancel: "Keep old version",
            dangerous: true,
          });
          if (!should_update) {
            return false;
          }
        }
      }
    }

    const cart_partition = await this.os.file_store.get_partition("cartridge");
    const bucket = await cart_partition.create(null);
    const ids: string[] = [];
    for await (const entry of files) {
      const file_meta = cart.files[entry.index];
      if (file_meta == null) {
        throw new ECartCorrupted(cart.id);
      }
      if (!(await Cart.verify_file_integrity(file_meta, entry.data))) {
        throw new ECartCorrupted(cart.id);
      }
      const file = await bucket.put(entry.data);
      ids.push(file.id);
    }

    let cart_meta: Cart.BucketCart;
    try {
      cart_meta = {
        ...cart,
        files: {
          location: await cart_partition.persist(bucket, {
            type: "cartridge",
            id: cart.id,
            version: cart.version,
          }),
          nodes: cart.files.map((node, i) => {
            return {
              path: node.path,
              mime: node.mime,
              integrity_hash: node.integrity_hash,
              integrity_hash_algorithm: node.integrity_hash_algorithm,
              size: node.size,
              id: ids[i],
            };
          }),
        },
      };
    } finally {
      cart_partition.release(bucket);
    }

    const grants = Capability.grants_from_cartridge(cart_meta);
    const thumbnail = await maybe_make_file_url(
      cart_meta.metadata.presentation.thumbnail_path,
      cart_meta,
      bucket,
      this.THUMBNAIL_WIDTH,
      this.THUMBNAIL_HEIGHT
    );
    const banner = await maybe_make_file_url(
      cart_meta.metadata.presentation.banner_path,
      cart_meta,
      bucket,
      this.BANNER_WIDTH,
      this.BANNER_HEIGHT
    );

    await this.os.db.transaction(
      [
        ...Db.CartStore.tables,
        ...Db.PlayHabitsStore.tables,
        ...Db.ObjectStorage.tables,
        ...Db.CapabilityStore.tables,
      ],
      "readwrite",
      async (t) => {
        const carts = new Db.CartStore(t);
        const habits = new Db.PlayHabitsStore(t);
        const object_store = new Db.ObjectStorage(t);
        const capabilities = new Db.CapabilityStore(t);

        const old_meta = await carts.meta.try_get(cart.id);
        if (old_meta != null) {
          await carts.archive(old_meta.id);
        }
        await carts.insert(cart_meta, thumbnail, banner);
        await habits.initialise(cart.id);
        await object_store.initialise_partitions(cart.id, cart.version);
        await capabilities.initialise_grants(cart.id, grants);
      }
    );

    if (old_meta != null && old_meta.bucket_key != null) {
      const key = old_meta.bucket_key;
      const partition = await this.os.file_store.get_partition(key.partition);
      await partition.release_persistent(key);
    }

    await this.os.audit_supervisor.log("kate:cart-manager", {
      resources: ["kate:storage"],
      risk: "low",
      type: "kate.storage.cartridge-installed",
      message: `Installed cartridge ${cart.id} v${cart.version}`,
      extra: {
        cartridge: cart.id,
        version: cart.version,
        title: cart.metadata.presentation.title,
        grants: grants.map((x) => x.serialise()),
        potential_risk: Capability.risk_from_grants(grants),
      },
    });
    await this.os.notifications.push_transient(
      "kate:cart-manager",
      `New game installed`,
      `${cart.metadata.presentation.title} is ready to play!`
    );
    this.os.events.on_cart_inserted.emit(cart_meta);
    this.os.events.on_cart_changed.emit({
      id: cart.id,
      reason: "installed",
    });
    return true;
  }

  async archive(cart_id: string) {
    if (this.os.processes.is_running(cart_id)) {
      throw new Error(`archive() called while cartridge is running.`);
    }
    const { bucket_key } = await this.read_metadata(cart_id);
    await Db.CartStore.transaction(this.os.db, "meta", "readwrite", async (store) => {
      await store.archive(cart_id);
    });
    if (bucket_key != null) {
      const partition = await this.os.file_store.get_partition(bucket_key.partition);
      await partition.release_persistent(bucket_key);
    }
    this.os.events.on_cart_archived.emit(cart_id);
    this.os.events.on_cart_changed.emit({ id: cart_id, reason: "archived" });
  }

  async delete_all_data(cart_id: string) {
    if (this.os.processes.is_running(cart_id)) {
      throw new Error(`delete_all_data() called while cartridge is running.`);
    }

    const meta = await this.read_metadata(cart_id);
    await this.os.db.transaction(
      [...Db.CartStore.tables, ...Db.ObjectStorage.tables, ...Db.PlayHabitsStore.tables],
      "readwrite",
      async (txn) => {
        await new Db.CartStore(txn).remove(cart_id);
        await new Db.ObjectStorage(txn).delete_partitions_and_quota(cart_id);
        await new Db.PlayHabitsStore(txn).remove(cart_id);
      }
    );
    if (meta.bucket_key != null) {
      const partition = await this.os.file_store.get_partition(meta.bucket_key.partition);
      partition.release_persistent(meta.bucket_key);
    }
    this.os.events.on_cart_removed.emit({
      id: cart_id,
      title: meta.metadata.presentation.title,
    });
    this.os.events.on_cart_changed.emit({ id: cart_id, reason: "removed" });
  }

  // Usage estimation
  async usage_estimates() {
    const cartridges = await this.list_all();
    const result = new Map<
      string,
      {
        status: Db.CartridgeStatus;
        thumbnail_url: string | null;
        banner_url: string | null;
        meta: Db.CartMeta_v3;
        version_id: string;
        size: number;
      }
    >();
    for (const cart of cartridges) {
      const size = cart.files.reduce((total, file) => total + file.size, 0);
      result.set(cart.id, {
        meta: cart,
        version_id: cart.version,
        status: cart.status,
        thumbnail_url: cart.thumbnail_dataurl,
        banner_url: cart.banner_dataurl,
        size: size,
      });
    }
    return result;
  }
}

async function maybe_make_file_url(
  path: string | null,
  cart: Cart.BucketCart,
  bucket: KateFileBucket,
  width: number,
  height: number
) {
  if (path == null) {
    return null;
  } else {
    const file = cart.files.nodes.find((x) => x.path === path);
    if (file == null) {
      throw new Error(`File not found: ${path}`);
    }
    const handle = await bucket.file(file.id).read();
    const data = new Uint8Array(await handle.arrayBuffer());
    return make_thumbnail_from_bytes(width, height, file.mime, data);
  }
}
