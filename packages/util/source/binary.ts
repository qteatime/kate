/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { zip } from "./iterable";

export function concat_all(bytearrays: Uint8Array[]) {
  const size = bytearrays.reduce((a, b) => a + b.byteLength, 0);
  const result = new Uint8Array(size);

  let offset = 0;
  for (const bytes of bytearrays) {
    result.set(bytes, offset);
    offset += bytes.byteLength;
  }

  return result;
}

export function byte_equals(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }
  for (const [x, y] of zip(a, b)) {
    if (x !== y) {
      return false;
    }
  }
  return true;
}

export function bytes_to_hex(x: Uint8Array) {
  return Array.from(x)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join(" ");
}

export function bytes_to_base64(x: Uint8Array) {
  return btoa(
    Array.from(x)
      .map((x) => String.fromCharCode(x))
      .join("")
  );
}

export function base64_to_bytes(x: string) {
  return new Uint8Array(
    atob(x)
      .split("")
      .map((x) => x.charCodeAt(0))
  );
}
