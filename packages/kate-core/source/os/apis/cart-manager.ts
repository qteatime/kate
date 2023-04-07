import * as Cart from "../../cart";
import type { KateOS } from "../os";
import * as Db from "../../data";
import { make_id, make_thumbnail_from_bytes } from "../../utils";

export class CartManager {
  readonly CARTRIDGE_SIZE_LIMIT = 1024 * 1024 * 512; // 512MB
  readonly THUMBNAIL_WIDTH = 200;
  readonly THUMBNAIL_HEIGHT = 350;

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
      const version = old_meta.metadata.release.version;
      const title = old_meta.metadata.game.title;
      const should_update = await this.os.dialog.confirm("kate:installer", {
        title: `Update ${title}?`,
        message: `A cartridge already exists for ${cart.metadata.id}. Update it to ${title} v${version.major}.${version.minor}?`,
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
      [Db.cart_meta, Db.cart_files, Db.play_habits],
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
        });
        const play_habits = (await habits.try_get(cart.metadata.id)) ?? {
          id: cart.metadata.id,
          last_played: null,
          play_time: 0,
        };
        await habits.put(play_habits);
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
