/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Cart_v5 } from "./v5";
import type { File } from "../cart-type";
import { str } from "../parser-utils";

export function parse_files(files: Cart_v5.File[]) {
  return files.map(parse_file);
}

export function parse_file(file: Cart_v5.File): File {
  return {
    path: str(file.path, 1_024),
    mime: str(file.mime, 255),
    integrity_hash: file.integrity,
    integrity_hash_algorithm: "SHA-256",
    data: file.data,
  };
}
