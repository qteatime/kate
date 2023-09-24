/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function file_to_dataurl(file: { mime: string; data: Uint8Array }) {
  const content = Array.from(file.data)
    .map((x) => String.fromCharCode(x))
    .join("");
  return `data:${file.mime};base64,${btoa(content)}`;
}
