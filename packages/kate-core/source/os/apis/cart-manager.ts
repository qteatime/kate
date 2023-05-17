import * as Cart from "../../cart";
import type { KateOS } from "../os";
import * as Db from "../../data";
import { make_id, make_thumbnail_from_bytes } from "../../utils";

export class CartManager {
  readonly CARTRIDGE_SIZE_LIMIT = 1024 * 1024 * 512; // 512MB
  readonly THUMBNAIL_WIDTH = 400;
  readonly THUMBNAIL_HEIGHT = 700;

  constructor(readonly os: KateOS) {}

  async list(): Promise<{ meta: Db.CartMeta; habits: Db.PlayHabits }[]> {
    return await this.os.db.transaction(
      [Db.cart_meta, Db.play_habits],
      "readonly",
      async (t) => {
        const meta = t.get_table1(Db.cart_meta);
        const habits = t.get_table1(Db.play_habits);

        const carts = await meta.get_all();
        const full_data = carts.map(async (x) => ({
          meta: x,
          habits: await habits.get(x.id),
        }));
        return Promise.all(full_data);
      }
    );
  }

  // -- Retrieval
  async read_files_by_cart(id: string) {
    const cartridge = await this.os.db.transaction(
      [Db.cart_meta, Db.cart_files],
      "readonly",
      async (t) => {
        const meta = t.get_table1(Db.cart_meta);
        const files = t.get_table2(Db.cart_files);

        const cart_meta = await meta.get(id);
        const cart_files = await Promise.all(
          cart_meta.files.map((x) => [x.path, files.get([id, x.id])] as const)
        );
        return new Map(cart_files);
      }
    );
    return cartridge;
  }

  async read_file_by_id(id: string, file_id: string) {
    return await this.os.db.transaction(
      [Db.cart_files],
      "readonly",
      async (t) => {
        const files = t.get_table2(Db.cart_files);
        return files.get([id, file_id]);
      }
    );
  }

  async try_read_metadata(id: string) {
    return await this.os.db.transaction(
      [Db.cart_meta],
      "readonly",
      async (t) => {
        const meta = t.get_table1(Db.cart_meta);
        const cart_meta = await meta.try_get(id);
        if (cart_meta == null) {
          return null;
        }
        return cart_meta;
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
        `${file.name} exceeds the 512MB cartridge size limit.`
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

  async uninstall(cart: { id: string; title: string }) {
    await this.os.db.transaction(
      [Db.cart_meta, Db.cart_files],
      "readwrite",
      async (t) => {
        const meta = t.get_table1(Db.cart_meta);
        const files = t.get_table2(Db.cart_files);

        const cart_meta = await meta.get(cart.id);
        for (const file of cart_meta.files) {
          await files.delete([cart.id, file.id]);
        }

        await meta.delete(cart.id);
      }
    );
    await this.os.notifications.push(
      "kate:cart-manager",
      `Game uninstalled`,
      `${cart.title} ${cart.id} and its data was removed.`
    );
    await this.os.events.on_cart_removed.emit(cart);
  }

  async install(cart: Cart.Cart) {
    const old_meta = await this.try_read_metadata(cart.metadata.id);
    if (old_meta != null) {
      const version = cart.metadata.release.version;
      const title = cart.metadata.game.title;
      const old_title = old_meta.metadata.game.title;
      const old_version = old_meta.metadata.release.version;
      const should_update = await this.os.dialog.confirm("kate:installer", {
        title: `Update ${old_title}?`,
        message: `A cartridge already exists for ${cart.metadata.id} (${old_title} v${old_version.major}.${old_version.minor}). Update it to ${title} v${version.major}.${version.minor}?`,
        ok: "Update",
        cancel: "Keep old version",
        dangerous: true,
      });
      if (!should_update) {
        return false;
      }
    }

    const thumbnail = await make_thumbnail_from_bytes(
      this.THUMBNAIL_WIDTH,
      this.THUMBNAIL_HEIGHT,
      cart.thumbnail.mime,
      cart.thumbnail.data
    );

    await this.os.db.transaction(
      [Db.cart_meta, Db.cart_files, Db.play_habits, ...Db.ObjectStorage.tables],
      "readwrite",
      async (t) => {
        const meta = t.get_table1(Db.cart_meta);
        const files = t.get_table2(Db.cart_files);
        const habits = t.get_table1(Db.play_habits);

        if (old_meta != null) {
          for (const file of old_meta.files) {
            await files.delete([cart.metadata.id, file.id]);
          }
        }

        let nodes: Db.CartMeta["files"] = [];
        for (const node of cart.files) {
          const id = make_id();
          await files.put({
            id: cart.metadata.id,
            file_id: id,
            mime: node.mime,
            data: node.data,
          });
          nodes.push({
            id: id,
            path: node.path,
            size: node.data.length,
          });
        }
        const now = new Date();
        await meta.put({
          id: cart.metadata.id,
          metadata: cart.metadata,
          runtime: cart.runtime,
          thumbnail_dataurl: thumbnail,
          files: nodes,
          installed_at: old_meta?.installed_at ?? now,
          updated_at: now,
          status: "active",
        });
        const play_habits = (await habits.try_get(cart.metadata.id)) ?? {
          id: cart.metadata.id,
          last_played: null,
          play_time: 0,
        };
        await habits.put(play_habits);

        await new Db.ObjectStorage(t).initialise_partitions(
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
    return true;
  }

  async archive(cart_id: string) {
    await Db.CartStore.transaction(this.os.db, "readwrite", async (store) => {
      await store.archive(cart_id);
    });
    this.os.events.on_cart_archived.emit(cart_id);
    this.os.events.on_cart_changed.emit({ id: cart_id, reason: "archived" });
  }

  async delete_all_data(cart_id: string) {
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
    const cartridges = await this.list();
    const result = new Map<
      string,
      {
        status: Db.CartridgeStatus;
        habits: Db.PlayHabits;
        thumbnail_url: string;
        meta: Db.CartMeta;
        version_id: string;
        size: number;
      }
    >();
    for (const cart of cartridges) {
      const size = cart.meta.files.reduce(
        (total, file) => total + file.size,
        0
      );
      result.set(cart.meta.id, {
        meta: cart.meta,
        habits: cart.habits,
        version_id: cart.meta.metadata.version_id,
        status: cart.meta.status,
        thumbnail_url: cart.meta.thumbnail_dataurl,
        size: size,
      });
    }
    return result;
  }

  // -- Playing habits
  async read_habits(id: string) {
    await this.os.db.transaction([Db.play_habits], "readonly", async (t) => {
      const habits = t.get_table1(Db.play_habits);
      return habits.get(id);
    });
  }

  async habit_history() {
    return await this.os.db.transaction(
      [Db.play_habits, Db.cart_meta],
      "readonly",
      async (t) => {
        const carts = t.get_table1(Db.cart_meta);
        const habits = t.get_table1(Db.play_habits);
        const entries = await habits.get_all();

        return Promise.all<
          Db.PlayHabits & { title: string; installed: boolean }
        >(
          entries.map(async (x) => {
            const cart = await carts.try_get(x.id);
            return {
              id: x.id,
              installed: cart != null,
              title: cart?.metadata.game.title ?? x.id,
              last_played: x.last_played,
              play_time: x.play_time,
            };
          })
        );
      }
    );
  }

  async delete_play_habits() {
    await this.os.db.transaction([Db.play_habits], "readwrite", async (t) => {
      const habits = t.get_table1(Db.play_habits);
      const rows = await habits.get_all();
      for (const row of rows) {
        await habits.put({
          id: row.id,
          last_played: null,
          play_time: 0,
        });
      }
    });
  }

  async delete_single_play_habits(id: string, remove: boolean) {
    await this.os.db.transaction([Db.play_habits], "readwrite", async (t) => {
      const habits = t.get_table1(Db.play_habits);
      if (remove) {
        habits.delete(id);
      } else {
        habits.put({
          id: id,
          last_played: null,
          play_time: 0,
        });
      }
    });
  }

  async update_last_played(cart_id: string, last_played: Date | null) {
    if (!this.os.settings.get("play_habits").recently_played) {
      return;
    }

    await this.os.db.transaction([Db.play_habits], "readwrite", async (t) => {
      const habits = t.get_table1(Db.play_habits);
      const cart = await habits.get(cart_id);
      cart.last_played = last_played;
      await habits.put(cart);
    });
  }

  async increase_play_time(cart_id: string, play_time: number) {
    if (!this.os.settings.get("play_habits").play_times) {
      return;
    }

    await this.os.db.transaction([Db.play_habits], "readwrite", async (t) => {
      const habits = t.get_table1(Db.play_habits);
      const cart = await habits.get(cart_id);
      cart.play_time += play_time || 0;
      await habits.put(cart);
    });
  }
}
