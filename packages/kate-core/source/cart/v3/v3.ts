import * as Cart_v3 from "../../../../schema/lib/cartridge-schema";
import * as Metadata from "./metadata";
import * as Runtime from "./runtime";
import * as Files from "./files";
import { Cart } from "../cart-type";
export { Cart_v3 };

const MAGIC = Number(
  "0x" +
    "KART"
      .split("")
      .map((x) => x.charCodeAt(0).toString(16))
      .join("")
);

export function parse_v3(x: Uint8Array): Cart | null {
  const view = new DataView(x.buffer);
  const magic_header = view.getUint32(0, false);
  if (magic_header !== MAGIC) {
    return null;
  }

  const cart = Cart_v3.decode(x, Cart_v3.Cartridge.tag);
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
