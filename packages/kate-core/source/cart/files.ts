import { Cart_v2 } from "./v2";

export type File = {
  path: string;
  mime: string;
  data: Uint8Array;
};

export function parse_files(cart: Cart_v2.Cartridge) {
  return cart.files.map(parse_file);
}

export function parse_file(file: Cart_v2.File): File {
  return {
    path: file.path,
    mime: file.mime,
    data: file.data,
  };
}
