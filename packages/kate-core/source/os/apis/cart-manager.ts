import * as Cart from "../../cart";
import * as Capability from "../../capabilities";
import type { KateOS } from "../os";
import * as Db from "../../data";
import {
  from_bytes,
  gb,
  make_thumbnail_from_bytes,
  serialise_error,
} from "../../utils";

export class CartManager {
  readonly CARTRIDGE_SIZE_LIMIT = gb(1.4);
  readonly THUMBNAIL_WIDTH = 400;
  readonly THUMBNAIL_HEIGHT = 700;
  readonly BANNER_WIDTH = 1280;
  readonly BANNER_HEIGHT = 200;

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
        `${file.name} (${from_bytes(file.size)}) exceeds the ${from_bytes(
          this.CARTRIDGE_SIZE_LIMIT
        )} cartridge size limit.`
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
      const errors = await Cart.verify_integrity(cart);
      if (errors.length !== 0) {
        console.error(`Corrupted cartridge ${cart.id}`, errors);
        throw new Error(`Corrupted cartridge ${cart.id}`);
      }
      await this.install(cart);
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

  async install(cart: Cart.Cart) {
    if (this.os.kernel.console.options.mode === "single") {
      throw new Error(
        `Cartridge installation is not available in single mode.`
      );
    }

    const old_meta = await this.try_read_metadata(cart.id);
    if (old_meta != null) {
      const version = cart.version;
      const title = cart.metadata.presentation.title;
      const old_title = old_meta.metadata.presentation.title;
      const old_version = old_meta.version;
      if (old_meta.status === "active") {
        if (
          old_version === version &&
          !this.os.settings.get("developer").allow_version_overwrite
        ) {
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

    const grants = Capability.grants_from_cartridge(cart);

    const thumbnail = await maybe_make_file_url(
      cart.metadata.presentation.thumbnail_path,
      cart,
      this.THUMBNAIL_WIDTH,
      this.THUMBNAIL_HEIGHT
    );
    const banner = await maybe_make_file_url(
      cart.metadata.presentation.banner_path,
      cart,
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
        await carts.insert(cart, thumbnail, banner);
        await habits.initialise(cart.id);
        await object_store.initialise_partitions(cart.id, cart.version);
        await capabilities.initialise_grants(cart.id, grants);
      }
    );

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
    this.os.events.on_cart_inserted.emit(cart);
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
        meta: Db.CartMeta;
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

function maybe_make_file_url(
  path: string | null,
  cart: Cart.Cart,
  width: number,
  height: number
) {
  if (path == null) {
    return null;
  } else {
    const file = cart.files.find((x) => x.path === path);
    if (file == null) {
      throw new Error(`File not found: ${path}`);
    }
    return make_thumbnail_from_bytes(width, height, file.mime, file.data);
  }
}
