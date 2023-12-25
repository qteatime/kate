/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart_v4 from "../../../../schema/build/kart-v4";
import { DataCart } from "../cart-type";
import { regex, str } from "../parser-utils";
import * as Metadata from "./metadata";
import * as Runtime from "./runtime";
import * as Files from "./files";
import * as Security from "./security";
import { mb } from "../../utils";
export { Cart_v4 };

const MAGIC = Number(
  "0x" +
    "KART"
      .split("")
      .map((x) => x.charCodeAt(0).toString(16))
      .join("")
);

const valid_id = regex("id", /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/);

function version_string(version: Cart_v4.Version) {
  return `${version.major}.${version.minor}`;
}

function date(x: Cart_v4.Date): Date {
  return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}

export function parse_v4(x: Uint8Array): DataCart | null {
  const view = new DataView(x.buffer);
  const magic_header = view.getUint32(0, false);
  if (magic_header !== MAGIC) {
    return null;
  }
  const version = view.getUint32(4, true);
  if (version !== 4) {
    return null;
  }

  const cart = Cart_v4.decode(x);
  const meta = Metadata.parse_metadata(cart);
  const runtime = Runtime.parse_runtime(cart);
  const security = Security.parse_security(cart);
  const files = Files.parse_files(cart);

  return {
    id: str(valid_id(cart.id), 255),
    version: version_string(cart.version),
    release_date: date(cart["release-date"]),
    minimum_kate_version: { major: 0, minor: 23, patch: 10 },
    metadata: meta,
    security: security,
    runtime: runtime,
    files: files,
  };
}
