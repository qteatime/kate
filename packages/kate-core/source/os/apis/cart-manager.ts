import * as Cart from "../../../../schema/generated/cartridge";
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
          `${cart.metadata?.title ?? cart.id} is ready to play!`
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
    const result = await this.os.db.transaction(
      [Db.cart_meta, Db.cart_files],
      "readwrite",
      async (t) => {
        const meta = t.get_table(Db.cart_meta);
        const files = t.get_table(Db.cart_files);

        const encoder = new Cart._Encoder();
        cart.encode(encoder);
        const bytes = encoder.to_bytes();

        await meta.write({
          id: cart.id,
          title: cart.metadata?.title ?? cart.id,
          description: cart.metadata?.description ?? "",
          thumbnail: cart.metadata?.thumbnail
            ? {
                mime: cart.metadata!.thumbnail!.mime,
                bytes: cart.metadata!.thumbnail!.data,
              }
            : null,
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
