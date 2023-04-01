import * as Cart_v2 from "../../../schema/generated/cartridge";
import * as Fingerprint from "../../../schema/lib/fingerprint";
import * as Metadata from "./metadata";
import * as Runtime from "./runtime";
import * as Files from "./files";
import { Cart } from "./cart-type";

export { Cart_v2, Fingerprint };

export function parse_v2(x: Uint8Array): Cart | null {
  let cart: Cart_v2.Cartridge;
  let view: DataView;
  try {
    view = Fingerprint.remove_fingerprint(new DataView(x.buffer));
  } catch (error) {
    return null;
  }

  const decoder = new Cart_v2._Decoder(view);
  cart = Cart_v2.Cartridge.decode(decoder);

  return {
    metadata: Metadata.parse_metadata(cart),
    runtime: Runtime.parse_runtime(cart),
    thumbnail: Files.parse_file(cart.metadata.title.thumbnail),
    files: Files.parse_files(cart),
  };
}
