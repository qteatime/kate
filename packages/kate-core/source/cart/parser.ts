/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { DataCart, DataFile } from "./cart-type";
import * as v4 from "./v4/v4";
import * as v5 from "./v5/v5";

const parsers = [
  { detect: v4.detect, parse: v4.parse_v4 },
  { detect: v5.detect, parse: v5.parse_v5 },
];

export async function try_parse(data: Blob | File) {
  for (const parser of parsers) {
    if (await parser.detect(data)) {
      return await parser.parse(data);
    }
  }

  return null;
}

export async function parse(data: Blob | File) {
  const cart = await try_parse(data);
  if (cart == null) {
    throw new Error(`No suitable parsers found`);
  }
  return cart;
}

export async function verify_integrity(cart: DataCart) {
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

async function check_file_integrity(file: DataFile) {
  const hash = await crypto.subtle.digest(file.integrity_hash_algorithm, file.data.buffer);
  return byte_equals(new Uint8Array(hash), file.integrity_hash);
}

function check_file_exists(path: string | null, cart: DataCart) {
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
