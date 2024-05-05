/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as Cart_v6 from "../../../../schema/build/kart-v6";
import { DataCart, KateVersion } from "../cart-type";
import { regex, str, bytes } from "../parser-utils";
import * as Metadata from "./metadata";
import * as Runtime from "./runtime";
import * as Files from "./files";
import * as Security from "./security";
import { SemVer } from "../../utils";
export { Cart_v6 };

const MAGIC = Number(
  "0x" +
    "KART"
      .split("")
      .map((x) => x.charCodeAt(0).toString(16))
      .join("")
);

const valid_id = regex("id", /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/);

function version_string(version: Cart_v6.Version) {
  return `${version.major}.${version.minor}`;
}

function date(x: Cart_v6.Date): Date {
  return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}

export async function detect(x: Blob): Promise<boolean> {
  const buffer = await x.slice(0, 8).arrayBuffer();
  return check_header(new Uint8Array(buffer));
}

export function minimum_version(x: Cart_v6.Header) {
  const kate_ver = x["minimum-kate-version"];
  return new SemVer(kate_ver.major, kate_ver.minor, kate_ver.patch, null);
}

export async function decode_header(file: Blob): Promise<Cart_v6.Header> {
  return await Cart_v6.decode_blob_header(file);
}

export async function decode_metadata(file: Blob, header: Cart_v6.Header): Promise<DataCart> {
  const cart = await Cart_v6.decode_blob_metadata(file, header);

  const meta = Metadata.parse_metadata(cart);
  const runtime = Runtime.parse_runtime(cart);
  const security = Security.parse_security(cart);
  const files = Files.parse_files(cart.files);
  const kate_ver = header["minimum-kate-version"];

  return {
    id: str(valid_id(cart.identification.id), 255),
    version: version_string(cart.identification.version),
    minimum_kate_version: { major: kate_ver.major, minor: kate_ver.minor, patch: kate_ver.patch },
    release_date: date(cart.identification["release-date"]),
    metadata: meta,
    security: security,
    runtime: runtime,
    files: files,
    signatures: cart.signature.map((x) => ({
      signed_by: str(x["signed-by"], 255),
      key_id: str(x["key-id"], 255),
      signature: bytes(x.signature, 1024),
      verified: false,
    })),
  };
}

export async function read_raw_metadata(file: Blob, header: Cart_v6.Header): Promise<Uint8Array> {
  const meta = await Cart_v6.decode_blob_metadata(file, header);
  (meta as { -readonly [key in keyof Cart_v6.Metadata]: Cart_v6.Metadata[key] }).signature = [];
  return Cart_v6.encode_metadata(meta);
}

export async function* decode_files(file: Blob, header: Cart_v6.Header, metadata: DataCart) {
  yield* Cart_v6.decode_blob_files(file, header, metadata.files);
}

function check_header(x: Uint8Array): boolean {
  const view = new DataView(x.buffer);
  const magic_header = view.getUint32(0, false);
  if (magic_header !== MAGIC) {
    return false;
  }

  const version = view.getUint32(4, true);
  if (version !== 6) {
    return false;
  }

  return true;
}
