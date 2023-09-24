/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function make_id() {
  let id = new Uint8Array(16);
  crypto.getRandomValues(id);
  return Array.from(id)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
