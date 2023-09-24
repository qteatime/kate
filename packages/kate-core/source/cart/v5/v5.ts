/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart_v5 from "../../../../schema/build/kart-v5";
import { Cart, CartMeta } from "../cart-type";
import { regex, str } from "../parser-utils";
import * as Metadata from "./metadata";
import * as Runtime from "./runtime";
import * as Files from "./files";
import * as Security from "./security";
import { mb } from "../../utils";
export { Cart_v5 };

const MAGIC = Number(
  "0x" +
    "KART"
      .split("")
      .map((x) => x.charCodeAt(0).toString(16))
      .join("")
);

const valid_id = regex(
  "id",
  /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/
);

function version_string(version: Cart_v5.Version) {
  return `${version.major}.${version.minor}`;
}

function date(x: Cart_v5.Date): Date {
  return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}

export function parse_v5(x: Uint8Array): Cart | null {
  if (!check_header(x)) {
    return null;
  }

  const cart = Cart_v5.decode(x);
  const meta = Metadata.parse_metadata(cart.metadata);
  const runtime = Runtime.parse_runtime(cart.metadata);
  const security = Security.parse_security(cart.metadata);
  const files = Files.parse_files(cart.files);

  return {
    id: str(valid_id(cart.metadata.identification.id), 255),
    version: version_string(cart.metadata.identification.version),
    release_date: date(cart.metadata.identification["release-date"]),
    metadata: meta,
    security: security,
    runtime: runtime,
    files: files,
  };
}

export function parse_v4_metadata(x: Uint8Array): CartMeta | null {
  if (!check_header(x)) {
    return null;
  }

  const header = Cart_v5.decode_header(x);
  const metadata = Cart_v5.decode_metadata(x, header);
  const meta = Metadata.parse_metadata(metadata);
  const runtime = Runtime.parse_runtime(metadata);
  const security = Security.parse_security(metadata);

  return {
    id: str(valid_id(metadata.identification.id), 255),
    version: version_string(metadata.identification.version),
    release_date: date(metadata.identification["release-date"]),
    metadata: meta,
    security: security,
    runtime: runtime,
  };
}

function check_header(x: Uint8Array): boolean {
  const view = new DataView(x.buffer);
  const magic_header = view.getUint32(0, false);
  if (magic_header !== MAGIC) {
    return false;
  }

  const version = view.getUint32(4, true);
  if (version !== 5) {
    return false;
  }

  return true;
}
