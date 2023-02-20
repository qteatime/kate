import * as Cart from "../../../../schema/generated/cartridge";
import { add_fingerprint } from "../../../../schema/lib/fingerprint";
import type { KateOS } from "../os";
import * as Db from "./db";

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

  async install_from_file(file: File) {
    try {
      const cart = this.os.kernel.loader.load_bytes(await file.arrayBuffer());
      if (await this.install(cart)) {
        await this.os.notifications.push(
          "kate:installer",
          "New game installed",
          `${cart.metadata.title.title} is ready to play!`
        );
      }
    } catch (error) {
      console.error(`Failed to install ${file.name}:`, error);
      await this.os.notifications.push(
        "kate:installer",
        "Installation failed",
        `${file.name} could not be installed.`
      );
    }
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
      this.os.events.on_cart_inserted.emit(cart);
    }
    return result;
  }
}
