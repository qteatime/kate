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

export async function detect(x: Blob): Promise<boolean> {
  const buffer = await x.slice(0, 8).arrayBuffer();
  const view = new DataView(buffer);
  const magic_header = view.getUint32(0, false);
  const version = view.getUint32(4, true);
  return magic_header === MAGIC && version === 4;
}

export async function parse_v4(x: Blob): Promise<DataCart | null> {
  const buffer = await x.arrayBuffer();
  const view = new DataView(buffer);
  const magic_header = view.getUint32(0, false);
  if (magic_header !== MAGIC) {
    throw new Error(`invalid v4 header`);
  }
  const version = view.getUint32(4, true);
  if (version !== 4) {
    throw new Error(`invalid v4 header`);
  }

  const cart = Cart_v4.decode(new Uint8Array(buffer));
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
