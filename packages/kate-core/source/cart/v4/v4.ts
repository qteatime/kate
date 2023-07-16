import * as Cart_v4 from "../../../../schema/lib/cartridge-schema";
import { Cart } from "../cart-type";
import { regex, str } from "../parser-utils";
import * as Metadata from "./metadata";
import * as Runtime from "./runtime";
import * as Files from "./files";
export { Cart_v4 };

const MAGIC = Number(
  "0x" +
    "KART"
      .split("")
      .map((x) => x.charCodeAt(0).toString(16))
      .join("")
);

const valid_id = regex(
  "id",
  /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/
);

function version_string(version: Cart_v4.Version) {
  return `${version.major}.${version.minor}`;
}

function date(x: Cart_v4.Date): Date {
  return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}

export function parse_v4(x: Uint8Array): Cart | null {
  const view = new DataView(x.buffer);
  const magic_header = view.getUint32(0, false);
  if (magic_header !== MAGIC) {
    return null;
  }

  const cart = Cart_v4.decode(x, Cart_v4.Cartridge.tag);
  const meta = Metadata.parse_metadata(cart);
  const runtime = Runtime.parse_runtime(cart);
  const files = Files.parse_files(cart);

  return {
    id: str(valid_id(cart.id), 255),
    version: version_string(cart.version),
    release_date: date(cart["release-date"]),
    metadata: meta,
    runtime: runtime,
    files: files,
  };
}
