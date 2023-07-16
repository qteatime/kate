import { Cart_v4 } from "./v4";
import type { File } from "../cart-type";
import { str } from "../parser-utils";

export function parse_files(cart: Cart_v4.Cartridge) {
  return cart.files.map(parse_file);
}

export function parse_file(file: Cart_v4.File): File {
  return {
    path: str(file.path, 1_024),
    mime: str(file.mime, 255),
    integrity_hash: file.integrity,
    integrity_hash_algorithm: "SHA-256",
    data: file.data,
  };
}
