import * as Cart_v2 from "../../../../schema/generated/cartridge";
import * as Fingerprint from "../../../../schema/lib/fingerprint";
import * as Metadata from "./metadata";
import * as Runtime from "./runtime";
import * as Files from "./files";
import { Cart } from "../cart-type";

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

  const meta = Metadata.parse_metadata(cart);
  const runtime = Runtime.parse_runtime(cart);
  const files = Files.parse_files(cart);

  const text_encoder = new TextEncoder();
  files.push({
    path: "kate:licence",
    mime: "text/plain",
    data: text_encoder.encode(meta.release.legal_notices),
  });
  meta.release.legal_notices = "kate:licence";

  files.push({
    path: "kate:index",
    mime: "text/html",
    data: text_encoder.encode(runtime.html),
  });
  runtime.html = "kate:index";

  return {
    metadata: meta,
    runtime: runtime,
    thumbnail: Files.parse_file(cart.metadata.title.thumbnail),
    files: files,
  };
}
