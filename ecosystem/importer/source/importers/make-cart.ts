/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { kart_v6 as Cart, kart_v6 } from "../deps/schema";
import { Pathname, binary, make_id, unreachable } from "../deps/utils";
import { CartConfig } from "./core";

export function make_mapping(mapping: Record<KateTypes.InputKey, string | null>) {
  return new Map(
    Object.entries(mapping).flatMap(([k, v]) =>
      v == null ? [] : [make_key_pair([k as KateTypes.InputKey, v])]
    )
  );
}

function make_key_pair([virtual, key_id]: [KateTypes.InputKey, string]): [
  Cart.Virtual_key,
  Cart.Keyboard_key
] {
  return [
    make_virtual_key(virtual),
    Cart.Keyboard_key({
      code: key_id,
    }),
  ];
}

function make_virtual_key(key: KateTypes.InputKey) {
  switch (key) {
    case "up":
      return Cart.Virtual_key.Up({});
    case "right":
      return Cart.Virtual_key.Right({});
    case "down":
      return Cart.Virtual_key.Down({});
    case "left":
      return Cart.Virtual_key.Left({});
    case "menu":
      return Cart.Virtual_key.Menu({});
    case "x":
      return Cart.Virtual_key.X({});
    case "o":
      return Cart.Virtual_key.O({});
    case "sparkle":
      return Cart.Virtual_key.Sparkle({});
    case "ltrigger":
      return Cart.Virtual_key.L_trigger({});
    case "rtrigger":
      return Cart.Virtual_key.R_trigger({});
    case "capture":
      return Cart.Virtual_key.Capture({});
    case "berry":
      return Cart.Virtual_key.Berry({});
    default:
      throw unreachable(key, "unknown virtual key");
  }
}

const mime_table = Object.assign(Object.create(null), {
  // Text/code
  ".html": "text/html",
  ".xml": "application/xml",
  ".js": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  // Packaging
  ".zip": "application/zip",
  // Audio
  ".wav": "audio/wav",
  ".oga": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".flac": "audio/x-flac",
  ".opus": "audio/opus",
  ".weba": "audio/webm",
  // Video
  ".mp4": "video/mp4",
  ".mpeg": "video/mpeg",
  ".ogv": "video/ogg",
  ".webm": "video/webm",
  // Image
  ".png": "image/png",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  // Fonts
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
});

export function mime_type(path: Pathname) {
  return mime_table[path.extname() ?? ""] ?? "application/octet-stream";
}

export async function maybe_add_thumbnail(
  files: { meta: Cart.Meta_file; data: Uint8Array }[],
  thumbnail: Uint8Array | null
): Promise<{ meta: Cart.Meta_file; data: Uint8Array }[]> {
  if (thumbnail == null) {
    return files;
  } else {
    const file = await make_file(Pathname.from_string("kate-thumbnail.png"), thumbnail);
    return [...files, file];
  }
}

export function make_meta(title: string, thumbnail: Uint8Array | null) {
  return {
    presentation: Cart.Meta_presentation({
      title: title,
      author: "Unknown",
      tagline: "",
      description: "",
      "release-type": Cart.Release_type.Unofficial({}),
      "thumbnail-path": thumbnail != null ? "/kate-thumbnail.png" : null,
      "banner-path": null,
    }),
    classification: Cart.Meta_classification({
      genre: [],
      tags: [],
      rating: Cart.Content_rating.Unknown({}),
      warnings: null,
    }),
    legal: Cart.Meta_legal({
      "derivative-policy": Cart.Derivative_policy.Not_allowed({}),
      "licence-path": null,
      "privacy-policy-path": null,
    }),
    accessibility: Cart.Meta_accessibility({
      "input-methods": [],
      languages: [],
      provisions: [],
      "average-session-seconds": null,
      "average-completion-seconds": null,
    }),
  };
}

export function make_game_id(uuid: string, title: string) {
  return `imported.kate.local/${slug(title)}-${uuid}`;
}

export function slug(title: string, max_length: number = 32) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[ _]/g, "-")
    .replace(/\-+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .slice(0, max_length);
}

export async function make_file(path: Pathname, data: Uint8Array) {
  const integrity = await crypto.subtle.digest("SHA-512", data.buffer);
  return {
    meta: Cart.Meta_file({
      path: path.make_absolute().as_string(),
      mime: mime_type(path),
      integrity: new Uint8Array(integrity),
      "hash-algorithm": Cart.Hash_algorithm.Sha_512({}),
      size: data.length,
    }),
    data,
  };
}

export function encode_whole(cart: CartConfig) {
  let offset = 0n;
  const bytes = [];

  const magic = kart_v6.encode_magic();
  bytes.push(magic);
  offset += BigInt(magic.byteLength);
  const file_offset = offset;
  bytes.push(uint32(cart.files.length));
  offset += 4n;
  for (const file of cart.files) {
    bytes.push(uint32(file.byteLength));
    offset += 4n;
    bytes.push(file);
    offset += BigInt(file.byteLength);
  }

  const meta_offset = offset;
  const meta = kart_v6.encode_metadata(cart.metadata);
  bytes.push(meta);
  offset += BigInt(meta.byteLength);

  const header_offset = offset;
  bytes.push(
    kart_v6.encode_header(
      Cart.Header({
        "minimum-kate-version": Cart.Kate_version({ major: 0, minor: 24, patch: 2 }),
        "content-location": Cart.Binary_location({
          offset: file_offset,
          size: meta_offset - file_offset,
        }),
        "metadata-location": Cart.Binary_location({
          offset: meta_offset,
          size: header_offset - meta_offset,
        }),
      })
    )
  );

  return binary.concat_all(bytes);
}

function uint32(x: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, x, true);
  return bytes;
}
