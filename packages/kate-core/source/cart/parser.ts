import { parse_v2 } from "./v2";

const parsers = [parse_v2];

export function try_parse(data: Uint8Array) {
  for (const parser of parsers) {
    const cart = parser(data);
    if (cart != null) {
      return cart;
    }
  }

  return null;
}

export function parse(data: Uint8Array) {
  const cart = try_parse(data);
  if (cart == null) {
    throw new Error(`No suitable parsers found`);
  }
  return cart;
}