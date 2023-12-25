/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart_v5 from "../../../../schema/build/kart-v5";
import { DataCart } from "../cart-type";
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

const valid_id = regex("id", /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/);

function version_string(version: Cart_v5.Version) {
  return `${version.major}.${version.minor}`;
}

function date(x: Cart_v5.Date): Date {
  return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}

export async function detect(x: Blob): Promise<boolean> {
  const buffer = await x.slice(0, 10).arrayBuffer();
  return check_header(new Uint8Array(buffer));
}

export async function parse_v5(file: Blob): Promise<DataCart | null> {
  const buffer = await file.arrayBuffer();
  const x = new Uint8Array(buffer);
  if (!check_header(x)) {
    throw new Error(`invalid v5 header`);
  }

  const cart = Cart_v5.decode(x);
  const meta = Metadata.parse_metadata(cart.metadata);
  const runtime = Runtime.parse_runtime(cart.metadata);
  const security = Security.parse_security(cart.metadata);
  const files = Files.parse_files(cart.files);

  return {
    id: str(valid_id(cart.metadata.identification.id), 255),
    version: version_string(cart.metadata.identification.version),
    minimum_kate_version: { major: 0, minor: 23, patch: 10 },
    release_date: date(cart.metadata.identification["release-date"]),
    metadata: meta,
    security: security,
    runtime: runtime,
    files: files,
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
