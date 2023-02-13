import * as Cart from "../../../schema/generated/cartridge";
import { remove_fingerprint } from "../../../schema/lib/fingerprint";

export class KateLoader {
  load_bytes(bytes: ArrayBuffer) {
    const view = remove_fingerprint(new DataView(bytes));
    const decoder = new Cart._Decoder(view);
    return Cart.Cartridge.decode(decoder);
  }

  async load_from_url(url: string) {
    const bytes = await (await fetch(url)).arrayBuffer();
    return this.load_bytes(bytes);
  }
}
