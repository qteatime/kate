import * as Cart from "../../../../schema/generated/cartridge";
import { add_fingerprint } from "../../../../schema/lib/fingerprint";
import type { KateOS } from "../os";
import * as Db from "../../data/db";

export class CartManager {
  constructor(readonly os: KateOS) {}

  async list() {
    return await this.os.db.transaction(
      [Db.cart_meta],
      "readonly",
      async (t) => {
        const meta = t.get_table(Db.cart_meta);
        const result = await meta.get_all();
        return result;
      }
    );
  }

  async read(id: string) {
    const cartridge = await this.os.db.transaction(
      [Db.cart_files],
      "readonly",
      async (t) => {
        const files = t.get_table(Db.cart_files);
        const file = await files.get(id);
        return this.os.kernel.loader.load_bytes(file.bytes.buffer);
      }
    );
    return cartridge;
  }

  async read_legal(id: string) {
    const cartridge = await this.read(id);
    return cartridge.metadata.release.legal_notices;
  }

  async install_from_file(file: File) {
    try {
      const cart = this.os.kernel.loader.load_bytes(await file.arrayBuffer());
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
        const meta = t.get_table(Db.cart_meta);
        const files = t.get_table(Db.cart_files);
        await meta.delete(cart.id);
        await files.delete(cart.id);
      }
    );
    await this.os.notifications.push(
      "kate:cart-manager",
      `Game uninstalled`,
      `${cart.title} ${cart.id} and its data was removed.`
    );
    await this.os.events.on_cart_removed.emit(cart);
  }

  async install(cart: Cart.Cartridge) {
    const old_cart = await this.os.db.transaction(
      [Db.cart_meta],
      "readonly",
      async (t) => {
        const meta = t.get_table(Db.cart_meta);
        return await meta.try_get(cart.id);
      }
    );
    if (old_cart != null) {
      const v = cart.metadata.release.version;
      const title = cart.metadata.title.title;
      const should_update = await this.os.dialog.confirm("kate:installer", {
        title: `Update ${old_cart.title}?`,
        message: `A cartridge already exists for ${cart.id}. Update it to ${title} v${v.major}.${v.minor}?`,
        ok: "Update",
        cancel: "Keep old version",
        dangerous: true,
      });
      if (!should_update) {
        return false;
      }
    }

    const result = await this.os.db.transaction(
      [Db.cart_meta, Db.cart_files],
      "readwrite",
      async (t) => {
        const meta = t.get_table(Db.cart_meta);
        const files = t.get_table(Db.cart_files);

        const encoder = new Cart._Encoder();
        cart.encode(encoder);
        const bytes = add_fingerprint(encoder.to_bytes());

        await meta.write({
          id: cart.id,
          title: cart.metadata.title.title,
          description: cart.metadata.title.description,
          thumbnail: {
            mime: cart.metadata.title.thumbnail.mime,
            bytes: cart.metadata.title.thumbnail.data,
          },
          installed_at: new Date(),
        });
        await files.write({
          id: cart.id,
          bytes: bytes,
        });
        return true;
      }
    );
    if (result) {
      await this.os.notifications.push(
        "kate:cart-manager",
        `New game installed`,
        `${cart.metadata.title.title} is ready to play!`
      );
      this.os.events.on_cart_inserted.emit(cart);
    }
    return result;
  }
}
