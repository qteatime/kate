/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function mhz_to_ghz(n: number) {
  return `${(n / 1000).toFixed(3)} GHz`;
}

export function from_bytes(n0: number) {
  const units = [
    ["KB", 1024],
    ["MB", 1024],
    ["GB", 1024],
    ["TB", 1024],
  ] as const;

  let n = n0;
  let use_unit = "B";
  for (const [unit, bucket] of units) {
    if (n > bucket) {
      n /= bucket;
      use_unit = unit;
    } else {
      break;
    }
  }

  return `${n.toFixed(2)} ${use_unit}`;
}

export function bytes(n: number) {
  return n;
}

export function kb(n: number) {
  return 1_024 * bytes(n);
}

export function mb(n: number) {
  return 1_024 * kb(n);
}

export function gb(n: number) {
  return 1_024 * mb(n);
}
