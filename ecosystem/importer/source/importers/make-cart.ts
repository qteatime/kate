import { kart_v5 as Cart } from "../deps/schema";
import { Pathname, make_id, unreachable } from "../deps/utils";

export function make_mapping(mapping: Record<KateTypes.InputKey, string>) {
  return new Map(
    Object.entries(mapping).map(([k, v]) =>
      make_key_pair([k as KateTypes.InputKey, v])
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
    case "ltrigger":
      return Cart.Virtual_key.L_trigger({});
    case "rtrigger":
      return Cart.Virtual_key.R_trigger({});
    case "capture":
      return Cart.Virtual_key.Capture({});
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
  files: Cart.File[],
  thumbnail: Uint8Array | null
): Promise<Cart.File[]> {
  if (thumbnail == null) {
    return files;
  } else {
    const file = await make_file(
      Pathname.from_string("kate-thumbnail.png"),
      thumbnail
    );
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
  const integrity = await crypto.subtle.digest("SHA-256", data.buffer);
  return Cart.File({
    path: path.make_absolute().as_string(),
    mime: mime_type(path),
    integrity: new Uint8Array(integrity),
    data: data,
    signature: null,
  });
}
