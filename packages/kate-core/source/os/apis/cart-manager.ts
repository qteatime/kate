import * as Cart from "../../cart";
import type { KateOS } from "../os";
import * as Db from "../../data";
import {
  from_bytes,
  make_id,
  make_thumbnail_from_bytes,
  mb,
} from "../../utils";

export class CartManager {
  readonly CARTRIDGE_SIZE_LIMIT = mb(512);
  readonly THUMBNAIL_WIDTH = 400;
  readonly THUMBNAIL_HEIGHT = 700;

  constructor(readonly os: KateOS) {}

  async list_all() {
    return await Db.CartStore.transaction(
      this.os.db,
      "meta",
      "readonly",
      async (store) => {
        return store.list();
      }
    );
  }

  async list_by_status(status?: Db.CartridgeStatus): Promise<Db.CartMeta[]> {
    return await Db.CartStore.transaction(
      this.os.db,
      "meta",
      "readonly",
      async (store) => {
        return store.list_by_status(status);
      }
    );
  }

  // -- Retrieval
  async read_files_by_cart(id: string) {
    return await Db.CartStore.transaction(
      this.os.db,
      "all",
      "readonly",
      async (store) => {
        const cart_meta = await store.meta.get(id);
        const cart_files = await Promise.all(
          cart_meta.files.map(
            (x) => [x.path, store.files.get([id, x.id])] as const
          )
        );
        return new Map(cart_files);
      }
    );
  }

  async read_file_by_path(cart_id: string, path: string) {
    return await Db.CartStore.transaction(
      this.os.db,
      "all",
      "readonly",
      async (store) => {
        const cart = await store.meta.get(cart_id);
        const file_id = cart.files.find((x) => x.path === path)?.id;
        if (file_id == null) {
          throw new Error(`File not found: ${path}`);
        }
        return store.files.get([cart_id, file_id]);
      }
    );
  }

  async read_file_by_id(id: string, file_id: string) {
    return await Db.CartStore.transaction(
      this.os.db,
      "files",
      "readonly",
      async (store) => {
        return store.files.get([id, file_id]);
      }
    );
  }

  async try_read_metadata(id: string) {
    return await Db.CartStore.transaction(
      this.os.db,
      "meta",
      "readonly",
      async (store) => {
        return store.meta.try_get(id);
      }
    );
  }

  async read_metadata(id: string) {
    const metadata = await this.try_read_metadata(id);
    if (metadata == null) {
      throw new Error(`Cartridge not found: ${id}`);
    }
    return metadata;
  }

  // -- Installation
  async install_from_file(file: File) {
    if (file.size > this.CARTRIDGE_SIZE_LIMIT) {
      this.os.notifications.push_transient(
        "kate:cart-manager",
        "Installation failed",
        `${file.name} (${from_bytes(
          file.size
        )}) exceeds the 512MB cartridge size limit.`
      );
      return;
    }

    const estimated_unpacked_size =
      file.size + this.os.object_store.default_quota.maximum_size * 2;
    if (!(await this.os.storage_manager.can_fit(estimated_unpacked_size))) {
      this.os.notifications.push_transient(
        "kate:cart-manager",
        "Installation failed",
        `${file.name} (${from_bytes(
          estimated_unpacked_size
        )}) exceeds the storage capacity.`
      );
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const cart = Cart.parse(new Uint8Array(buffer));
      await this.install(cart);
    } catch (error) {
      console.error(`Failed to install ${file.name}:`, error);
      await this.os.notifications.push(
        "kate:cart-manager",
        "Installation failed",
        `${file.name} could not be installed.`
      );
    }
  }

  async install(cart: Cart.Cart) {
    const old_meta = await this.try_read_metadata(cart.metadata.id);
    if (old_meta != null) {
      const version = cart.metadata.version_id;
      const title = cart.metadata.game.title;
      const old_title = old_meta.metadata.game.title;
      const old_version = old_meta.metadata.version_id;
      if (old_meta.status === "active") {
        if (old_version === version) {
          await this.os.notifications.push_transient(
            "kate:cart-manager",
            `Cartridge not installed`,
            `${title} (${cart.metadata.id}) is already installed at version v${old_version}`
          );
          return false;
        } else {
          const should_update = await this.os.dialog.confirm("kate:installer", {
            title: `Update ${old_title}?`,
            message: `A cartridge already exists for ${cart.metadata.id} (${old_title} v${old_version}).
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

    const thumbnail = await make_thumbnail_from_bytes(
      this.THUMBNAIL_WIDTH,
      this.THUMBNAIL_HEIGHT,
      cart.thumbnail.mime,
      cart.thumbnail.data
    );

    await this.os.db.transaction(
      [
        ...Db.CartStore.tables,
        ...Db.PlayHabitsStore.tables,
        ...Db.ObjectStorage.tables,
      ],
      "readwrite",
      async (t) => {
        const carts = new Db.CartStore(t);
        const habits = new Db.PlayHabitsStore(t);
        const object_store = new Db.ObjectStorage(t);

        const old_meta = await carts.meta.try_get(cart.metadata.id);
        if (old_meta != null) {
          await carts.archive(old_meta.id);
        }
        await carts.insert(cart, thumbnail);
        await habits.initialise(cart.metadata.id);
        await object_store.initialise_partitions(
          cart.metadata.id,
          cart.metadata.version_id
        );
      }
    );

    await this.os.notifications.push(
      "kate:cart-manager",
      `New game installed`,
      `${cart.metadata.game.title} is ready to play!`
    );
    this.os.events.on_cart_inserted.emit(cart);
    this.os.events.on_cart_changed.emit({
      id: cart.metadata.id,
      reason: "installed",
    });
    return true;
  }

  async archive(cart_id: string) {
    if (this.os.processes.is_running(cart_id)) {
      throw new Error(`archive() called while cartridge is running.`);
    }
    await Db.CartStore.transaction(
      this.os.db,
      "all",
      "readwrite",
      async (store) => {
        await store.archive(cart_id);
      }
    );
    this.os.events.on_cart_archived.emit(cart_id);
    this.os.events.on_cart_changed.emit({ id: cart_id, reason: "archived" });
  }

  async delete_all_data(cart_id: string) {
    if (this.os.processes.is_running(cart_id)) {
      throw new Error(`delete_all_data() called while cartridge is running.`);
    }

    const meta = await this.read_metadata(cart_id);
    await this.os.db.transaction(
      [
        ...Db.CartStore.tables,
        ...Db.ObjectStorage.tables,
        ...Db.PlayHabitsStore.tables,
      ],
      "readwrite",
      async (txn) => {
        await new Db.CartStore(txn).remove(cart_id);
        await new Db.ObjectStorage(txn).delete_partitions_and_quota(cart_id);
        await new Db.PlayHabitsStore(txn).remove(cart_id);
      }
    );
    this.os.events.on_cart_removed.emit({
      id: cart_id,
      title: meta.metadata.game.title,
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
        thumbnail_url: string;
        meta: Db.CartMeta;
        version_id: string;
        size: number;
      }
    >();
    for (const cart of cartridges) {
      const size = cart.files.reduce((total, file) => total + file.size, 0);
      result.set(cart.id, {
        meta: cart,
        version_id: cart.metadata.version_id,
        status: cart.status,
        thumbnail_url: cart.thumbnail_dataurl,
        size: size,
      });
    }
    return result;
  }
}
