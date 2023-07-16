import { Cart, File } from "./cart-type";
import { parse_v4 } from "./v4/v4";

const parsers = [parse_v4];

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

export async function verify_integrity(cart: Cart) {
  const errors = [
    ...check_file_exists(cart.metadata.presentation.thumbnail_path, cart),
    ...check_file_exists(cart.metadata.presentation.banner_path, cart),
    ...check_file_exists(cart.metadata.legal.licence_path, cart),
    ...check_file_exists(cart.metadata.legal.privacy_policy_path, cart),
    ...check_file_exists(cart.runtime.html_path, cart),
  ];
  for (const file of cart.files) {
    if (!(await check_file_integrity(file))) {
      errors.push(`Corrupted file: ${file.path}`);
    }
  }
  return errors;
}

async function check_file_integrity(file: File) {
  const hash = await crypto.subtle.digest(
    file.integrity_hash_algorithm,
    file.data.buffer
  );
  return byte_equals(new Uint8Array(hash), file.integrity_hash);
}

function check_file_exists(path: string | null, cart: Cart) {
  if (path == null) {
    return [];
  } else {
    const file = cart.files.find((x) => x.path === path);
    if (file == null) {
      return [`File not found: ${path}`];
    } else {
      return [];
    }
  }
}

function byte_equals(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
