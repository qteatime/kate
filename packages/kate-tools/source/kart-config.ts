/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import { kart_v6 as Cart, kart_v6 } from "./deps/schema";
import { Pathname, Spec as T, bytes_to_hex, unreachable } from "./deps/util";

export const keymap = require("../assets/keymap.json") as {
  [key: string]: {
    key: string;
    code: string;
    key_code: number;
  };
};

export const spec_version = Cart.Kate_version({
  major: 0,
  minor: 25,
  patch: 0,
});

const genre = T.one_of([
  "action",
  "fighting",
  "interactive-fiction",
  "adventure",
  "visual-novel",
  "platformer",
  "puzzle",
  "racing",
  "rhythm",
  "rpg",
  "simulation",
  "shooter",
  "sports",
  "strategy",
  "tool",
  "other",
] as const);

const release_type = T.one_of(["prototype", "early-access", "beta", "demo", "regular"] as const);

const content_rating = T.one_of([
  "general",
  "teen-and-up",
  "mature",
  "explicit",
  "unknown",
] as const);

const duration = T.spec({
  unit: T.one_of(["seconds", "minutes", "hours"] as const),
  value: T.optional(1, T.int),
});

const derivative_policy = T.one_of([
  "not-allowed",
  "personal-use",
  "non-commercial-use",
  "commercial-use",
] as const);

const input_method = T.one_of(["buttons", "pointer"] as const);

const accessibility = T.one_of([
  "high-contrast",
  "subtitles",
  "image-captions",
  "voiced-text",
  "configurable-difficulty",
  "skippable-content",
] as const);

const valid_id = T.regex("valid id", /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/);
const valid_language = T.regex("valid ISO language code", /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/);

const meta = T.spec({
  presentation: T.spec({
    author: T.short_str(255),
    title: T.short_str(255),
    tagline: T.short_str(255),
    description: T.optional("", T.short_str(10_000)),
    release_type: T.optional("regular", release_type),
    thumbnail_path: T.nullable(T.str),
    banner_path: T.nullable(T.str),
  }),
  classification: T.nullable(
    T.spec({
      genre: T.optional(["other"], T.seq2(T.list_of(genre), T.min_max_items(1, 10))) as (
        _: any
      ) => Genre[],
      tags: T.optional([], T.seq2(T.list_of(T.short_str(255)), T.min_max_items(0, 10))) as (
        _: any
      ) => string[],
      rating: T.optional("unknown", content_rating),
      warnings: T.nullable(T.short_str(1_000)),
    })
  ),
  legal: T.nullable(
    T.spec({
      licence_path: T.nullable(T.str),
      privacy_policy_path: T.nullable(T.str),
      derivative_policy: T.optional("personal-use", derivative_policy),
    })
  ),
  accessibility: T.nullable(
    T.spec({
      input_methods: T.optional([], T.list_of(input_method)),
      languages: T.optional(
        [],
        T.list_of(
          T.spec({
            iso_code: T.seq2(T.short_str(255), valid_language),
            interface: T.bool,
            audio: T.bool,
            text: T.bool,
          })
        )
      ),
      provisions: T.optional([], T.list_of(accessibility)),
      average_completion: T.optional(null, duration),
      average_session: T.optional(null, duration),
    })
  ),
});

const bridges = T.tagged_choice<Bridge, Bridge["type"]>("type", {
  "network-proxy": T.spec({
    type: T.constant("network-proxy" as const),
    sync_access: T.list_of(T.short_str(255)),
  }),
  "local-storage-proxy": T.spec({
    type: T.constant("local-storage-proxy" as const),
  }),
  "input-proxy": T.spec({
    type: T.constant("input-proxy" as const),
    mapping: T.or3(
      T.constant("defaults" as const),
      T.constant("kate" as const),
      T.dictionary(T.str)
    ),
  }),
  "keyboard-input-proxy-v2": T.spec({
    type: T.constant("keyboard-input-proxy-v2" as const),
    mapping: T.or3(
      T.constant("defaults" as const),
      T.constant("kate" as const),
      T.dictionary(T.str)
    ),
    selector: T.short_str(255),
  }),
  "preserve-webgl-render": T.spec({
    type: T.constant("preserve-webgl-render" as const),
  }),
  "capture-canvas": T.spec({
    type: T.constant("capture-canvas" as const),
    selector: T.short_str(255),
  }),
  "pointer-input-proxy": T.spec({
    type: T.constant("pointer-input-proxy" as const),
    selector: T.short_str(255),
    hide_cursor: T.optional(false, T.bool),
  }),
  "indexeddb-proxy": T.spec({
    type: T.constant("indexeddb-proxy" as const),
    versioned: T.bool,
  }),
  "renpy-web-tweaks": T.spec({
    type: T.constant("renpy-web-tweaks" as const),
    version: T.spec({
      major: T.int,
      minor: T.int,
    }),
  }),
  "external-url-handler": T.spec({
    type: T.constant("external-url-handler" as const),
  }),
  "resize-canvas": T.spec({
    type: T.constant("resize-canvas" as const),
    selector: T.short_str(255),
  }),
});

const recipe = T.tagged_choice<Recipe, Recipe["type"]>("type", {
  identity: T.spec({
    type: T.constant("identity" as const),
  }),
  bitsy: T.spec({
    type: T.constant("bitsy" as const),
  }),
  renpy: T.spec({
    type: T.constant("renpy" as const),
    pointer_support: T.optional(true, T.bool),
    save_data: T.optional("versioned", T.one_of(["versioned" as const, "unversioned" as const])),
    renpy_version: T.regex("version in the form MM.NN (e.g.: 7.5, 8.1)", /^\d+\.\d+$/),
    hide_cursor: T.optional(false, T.bool),
    open_urls_reason: T.optional(null, T.short_str(255)),
  }),
  godot: T.spec({
    type: T.constant("godot" as const),
    version: T.constant("3" as const),
    pointer_support: T.optional(true, T.bool),
    hide_cursor: T.optional(false, T.bool),
  }),
  gamemaker: T.spec({
    type: T.constant("gamemaker" as const),
    pointer_support: T.optional(true, T.bool),
    hide_cursor: T.optional(false, T.bool),
  }),
  "rpg-maker-mv": T.spec({
    type: T.constant("rpg-maker-mv" as const),
    pointer_support: T.optional(true, T.bool),
    hide_cursor: T.optional(false, T.bool),
  }),
});

const platform_web = T.spec({
  type: T.constant("web-archive"),
  html: T.str,
  bridges: T.optional([], T.list_of(bridges)),
  recipe: T.optional({ type: "identity" }, recipe),
});

const capability = T.tagged_choice<Capability, Capability["type"]>("type", {
  "open-urls": T.spec({
    type: T.constant("open-urls" as const),
    reason: T.short_str(255),
  }),
  "request-device-files": T.spec({
    type: T.constant("request-device-files" as const),
    reason: T.short_str(255),
  }),
  "install-cartridges": T.spec({
    type: T.constant("install-cartridges" as const),
    reason: T.short_str(255),
  }),
  "download-files": T.spec({
    type: T.constant("download-files" as const),
    reason: T.short_str(255),
  }),
  "show-dialogs": T.spec({
    type: T.constant("show-dialogs" as const),
    reason: T.short_str(255),
  }),
  "store-temporary-files": T.spec({
    type: T.constant("store-temporary-files" as const),
    reason: T.short_str(255),
    max_size_mb: T.int,
    optional: T.bool,
  }),
  "sign-digitally": T.spec({
    type: T.constant("sign-digitally" as const),
    reason: T.short_str(255),
  }),
  "view-developer-profile": T.spec({
    type: T.constant("view-developer-profile" as const),
    reason: T.short_str(255),
  }),
});

const security = T.spec({
  capabilities: T.optional([], T.list_of(capability)),
});

export const config = T.spec({
  id: T.seq2(T.short_str(255), valid_id),
  version: T.spec({
    major: T.int,
    minor: T.int,
  }),
  release: T.optional(
    today(),
    T.spec({
      year: T.int,
      month: T.int,
      day: T.int,
    })
  ),
  root: T.nullable(T.str),
  metadata: meta,
  files: T.optional([], T.list_of(T.str)),
  security: T.optional({ capabilities: [] }, security),
  platform: platform_web,
});

function today(): CartDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export type Kart = ReturnType<typeof config>;

export type Genre =
  | null
  | "action"
  | "fighting"
  | "adventure"
  | "interactive-fiction"
  | "visual-novel"
  | "platformer"
  | "puzzle"
  | "racing"
  | "rhythm"
  | "rpg"
  | "simulation"
  | "shooter"
  | "sports"
  | "strategy"
  | "tool"
  | "other";

export type CartDate = { year: number; month: number; day: number };

export type Version = { major: number; minor: number };

export type ReleaseType = "prototype" | "early-access" | "beta" | "demo" | "regular";

export type ContentRating = "general" | "teen-and-up" | "mature" | "explicit" | "unknown";

export type DerivativePolicy = ReturnType<typeof derivative_policy>;

export type Duration = {
  unit: "seconds" | "minutes" | "hours";
  value: number;
};

export type InputMethod = "buttons" | "pointer";

export type Language = {
  iso_code: string;
  interface: boolean;
  audio: boolean;
  text: boolean;
};

export type Accessibility =
  | "high-contrast"
  | "subtitles"
  | "image-captions"
  | "voiced-text"
  | "configurable-difficulty"
  | "skippable-content";

export type KartPlatform = KPWeb;

export type KPWeb = {
  type: "web-archive";
  html: string;
  bridges: Bridge[];
};

export type KeyMapping = { [key: string]: string } | "defaults" | "kate";

export type Capability = ContextualCapability & { reason: string };

export type ContextualCapability =
  | { type: "open-urls" }
  | { type: "request-device-files" }
  | { type: "install-cartridges" }
  | { type: "download-files" }
  | { type: "show-dialogs" }
  | { type: "store-temporary-files"; max_size_mb: number; optional: boolean }
  | { type: "sign-digitally" }
  | { type: "view-developer-profile" };

export type Bridge =
  | { type: "network-proxy"; sync_access?: string[] }
  | { type: "local-storage-proxy" }
  | { type: "input-proxy"; mapping: KeyMapping }
  | {
      type: "keyboard-input-proxy-v2";
      mapping: KeyMapping;
      selector: string;
    }
  | { type: "preserve-webgl-render" }
  | { type: "capture-canvas"; selector: string }
  | { type: "pointer-input-proxy"; selector: string; hide_cursor: boolean }
  | { type: "indexeddb-proxy"; versioned: boolean }
  | { type: "renpy-web-tweaks"; version: { major: number; minor: number } }
  | { type: "external-url-handler" }
  | { type: "resize-canvas"; selector: string };

export type Recipe =
  | { type: "identity" }
  | {
      type: "renpy";
      pointer_support: boolean;
      save_data: "versioned" | "unversioned";
      hide_cursor: boolean;
      open_urls_reason: string | null;
      renpy_version: string;
    }
  | { type: "bitsy" }
  | { type: "godot"; version: "3"; pointer_support: boolean; hide_cursor: boolean }
  | { type: "gamemaker"; pointer_support: boolean; hide_cursor: boolean }
  | { type: "rpg-maker-mv"; pointer_support: boolean; hide_cursor: boolean };

export function apply_recipe(json: ReturnType<typeof config>): ReturnType<typeof config> {
  const recipe = json.platform.recipe;
  switch (recipe.type) {
    case "identity": {
      return json;
    }
    case "bitsy": {
      return {
        ...json,
        files: ["**/*.html", ...json.files],
        platform: {
          recipe,
          type: "web-archive",
          html: json.platform.html,
          bridges: select_bridges([
            { type: "keyboard-input-proxy-v2", mapping: "kate", selector: "document" },
            { type: "capture-canvas", selector: "#game" },
            { type: "resize-canvas", selector: "#game" },
            ...json.platform.bridges,
          ]),
        },
      };
    }
    case "renpy": {
      return {
        ...json,
        files: [
          // Text/code
          "**/*.html",
          "**/*.xml",
          "**/*.js",
          "**/*.css",
          "**/*.wasm",
          "**/*.txt",
          "**/*.md",
          "**/*.json",
          // Packaging
          "**/*.data",
          "**/*.zip",
          "**/*.rpa",
          // Audio
          "**/*.wav",
          "**/*.ogg",
          "**/*.oga",
          "**/*.mp2",
          "**/*.mp3",
          "**/*.m4a",
          "**/*.opus",
          "**/*.flac",
          "**/*.weba",
          // Video
          "**/*.webm",
          "**/*.ogv",
          "**/*.mp4",
          "**/*.mpeg",
          "**/*.mkv",
          "**/*.avi",
          // Image
          "**/*.webp",
          "**/*.png",
          "**/*.jpg",
          "**/*.jpeg",
          "**/*.bmp",
          "**/*.gif",
          "**/*.avif",
          "**/*.svg",
          // Font
          "**/*.ttf",
          "**/*.tga",
          "**/*.dds",
        ],
        security: {
          capabilities: [
            ...(recipe.open_urls_reason != null
              ? [
                  {
                    type: "open-urls" as const,
                    reason: recipe.open_urls_reason,
                  },
                ]
              : []),
            ...json.security.capabilities,
          ],
        },
        platform: {
          recipe,
          type: "web-archive",
          html: json.platform.html,
          bridges: select_bridges([
            { type: "network-proxy" },
            { type: "keyboard-input-proxy-v2", mapping: "defaults", selector: "window" },
            ...(recipe.pointer_support
              ? [
                  {
                    type: "pointer-input-proxy" as const,
                    selector: "#canvas",
                    hide_cursor: recipe.hide_cursor,
                  },
                ]
              : []),
            { type: "preserve-webgl-render" },
            { type: "capture-canvas", selector: "#canvas" },
            {
              type: "indexeddb-proxy",
              versioned: recipe.save_data === "versioned",
            },
            {
              type: "renpy-web-tweaks",
              version: renpy_version(recipe.renpy_version),
            },
            ...(recipe.open_urls_reason != null
              ? [
                  {
                    type: "external-url-handler" as const,
                  },
                ]
              : []),
            ...json.platform.bridges,
          ]),
        },
      };
    }

    case "godot": {
      return {
        ...json,
        files: ["**/*.html", "**/*.png", "**/*.js", "**/*.pck", "**/*.wasm"],
        platform: {
          recipe,
          type: "web-archive",
          html: json.platform.html,
          bridges: select_bridges([
            { type: "network-proxy", sync_access: ["*.js"] },
            { type: "keyboard-input-proxy-v2", mapping: "defaults", selector: "#canvas" },
            ...(recipe.pointer_support
              ? [
                  {
                    type: "pointer-input-proxy" as const,
                    selector: "#canvas",
                    hide_cursor: recipe.hide_cursor,
                  },
                ]
              : []),
            { type: "capture-canvas", selector: "#canvas" },
            { type: "preserve-webgl-render" },
            ...json.platform.bridges,
          ]),
        },
      };
    }

    case "rpg-maker-mv": {
      return {
        ...json,
        files: [
          "**/*.html",
          "**/*.json",
          "**/*.ogg",
          "**/*.css",
          "**/*.ttf",
          "**/*.png",
          "**/*.txt",
          "**/*.js",
        ],
        platform: {
          recipe,
          type: "web-archive",
          html: json.platform.html,
          bridges: select_bridges([
            { type: "network-proxy", sync_access: ["js/plugins/*.js", "img/tilesets/*.png"] },
            { type: "keyboard-input-proxy-v2", mapping: "defaults", selector: "document" },
            ...(recipe.pointer_support
              ? [
                  {
                    type: "pointer-input-proxy" as const,
                    selector: "#GameCanvas",
                    hide_cursor: recipe.hide_cursor,
                  },
                ]
              : []),
            { type: "capture-canvas", selector: "#GameCanvas" },
            { type: "preserve-webgl-render" },
            { type: "local-storage-proxy" },
            { type: "resize-canvas", selector: "#GameCanvas" },
            ...json.platform.bridges,
          ]),
        },
      };
    }

    case "gamemaker": {
      return {
        ...json,
        files: ["**/*.html", "**/*.ico", "**/*.ini", "**/*.js", "**/*.png", "**/*.ogg", "**/*.yy"],
        platform: {
          recipe,
          type: "web-archive",
          html: json.platform.html,
          bridges: select_bridges([
            { type: "network-proxy", sync_access: ["*.js"] },
            { type: "keyboard-input-proxy-v2", mapping: "defaults", selector: "#canvas" },
            ...(recipe.pointer_support
              ? [
                  {
                    type: "pointer-input-proxy" as const,
                    selector: "#canvas",
                    hide_cursor: recipe.hide_cursor,
                  },
                ]
              : []),
            { type: "capture-canvas", selector: "#canvas" },
            { type: "preserve-webgl-render" },
            ...json.platform.bridges,
          ]),
        },
      };
    }

    default:
      throw unreachable(recipe, "Recipe");
  }
}

function select_bridges(bridges: Bridge[]) {
  const indexes = new Map<string, number>();
  const result: Bridge[] = [];
  for (const bridge of bridges) {
    const old_index = indexes.get(bridge.type) ?? null;
    if (old_index == null) {
      const new_index = result.push(bridge) - 1;
      indexes.set(bridge.type, new_index);
    } else {
      result.splice(old_index, 1, bridge);
    }
  }
  return result;
}

function renpy_version(x: string) {
  const [_, major, minor] = x.match(/^(\d+)\.(\d+)$/)!;
  return { major: Number(major), minor: Number(minor) };
}

export const mime_table = Object.assign(Object.create(null), {
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

export function metadata(json: Kart, archive: Cart.Meta_file[]) {
  const x = json.metadata;
  if (x.presentation.thumbnail_path != null) {
    assert_file_in_archive(x.presentation.thumbnail_path, archive);
  }
  if (x.presentation.banner_path != null) {
    assert_file_in_archive(x.presentation.banner_path, archive);
  }
  if (x.legal?.licence_path != null) {
    assert_file_in_archive(x.legal.licence_path, archive);
  }
  if (x.legal?.privacy_policy_path != null) {
    assert_file_in_archive(x.legal.privacy_policy_path, archive);
  }

  const identification = Cart.Meta_identification({
    id: json.id,
    version: make_version(json.version),
    "release-date": make_date(json.release),
  });

  const presentation = Cart.Meta_presentation({
    title: x.presentation.title,
    author: x.presentation.author,
    tagline: x.presentation.tagline,
    description: x.presentation.description,
    "release-type": make_release_type(x.presentation.release_type),
    "thumbnail-path": x.presentation.thumbnail_path
      ? make_absolute(x.presentation.thumbnail_path)
      : null,
    "banner-path": x.presentation.banner_path ? make_absolute(x.presentation.banner_path) : null,
  });

  const classification = Cart.Meta_classification({
    genre: x.classification?.genre.map(make_genre) ?? [],
    tags: x.classification?.tags ?? [],
    rating: make_rating(x.classification?.rating ?? "unknown"),
    warnings: x.classification?.warnings ?? null,
  });

  const legal = Cart.Meta_legal({
    "derivative-policy": make_derivative_policy(x.legal?.derivative_policy ?? "personal-use"),
    "licence-path": x.legal?.licence_path ? make_absolute(x.legal.licence_path) : null,
    "privacy-policy-path": x.legal?.privacy_policy_path
      ? make_absolute(x.legal.privacy_policy_path)
      : null,
  });

  const accessibility = Cart.Meta_accessibility({
    "input-methods": x.accessibility?.input_methods.map(make_input_method) ?? [],
    languages: x.accessibility?.languages.map(make_language) ?? [],
    provisions: x.accessibility?.provisions.map(make_accessibility_provision) ?? [],
    "average-completion-seconds": x.accessibility?.average_completion
      ? make_duration(x.accessibility.average_completion)
      : null,
    "average-session-seconds": x.accessibility?.average_session
      ? make_duration(x.accessibility.average_session)
      : null,
  });

  const security = make_security(json.security);
  const runtime = make_runtime(json.platform);

  return Cart.Metadata({
    identification,
    presentation,
    classification,
    accessibility,
    legal,
    runtime,
    security,
    files: archive,
    signature: [],
  });
}

function make_runtime(x: Kart["platform"]) {
  switch (x.type) {
    case "web-archive": {
      return Cart.Runtime.Web_archive({
        "html-path": make_absolute(x.html),
        bridges: x.bridges.flatMap(make_bridge),
      });
    }

    default:
      throw new Error(`Unsupported type ${(x as any).type}`);
  }
}

function assert_file_in_archive(path: string, archive: Cart.Meta_file[]) {
  const expected = Pathname.from_string(path).make_absolute().as_string();
  const node = archive.find((x) => x.path === expected);
  if (node == null) {
    throw new Error(`Missing file ${path} in cartridge`);
  }
}

function make_genre(x: Genre): Cart.Genre {
  if (x == null) {
    return Cart.Genre.Not_specified({});
  } else {
    switch (x) {
      case "action":
        return Cart.Genre.Action({});
      case "fighting":
        return Cart.Genre.Fighting({});
      case "adventure":
        return Cart.Genre.Adventure({});
      case "visual-novel":
        return Cart.Genre.Visual_novel({});
      case "interactive-fiction":
        return Cart.Genre.Interactive_fiction({});
      case "platformer":
        return Cart.Genre.Platformer({});
      case "other":
        return Cart.Genre.Other({});
      case "puzzle":
        return Cart.Genre.Puzzle({});
      case "racing":
        return Cart.Genre.Racing({});
      case "rhythm":
        return Cart.Genre.Rhythm({});
      case "rpg":
        return Cart.Genre.RPG({});
      case "shooter":
        return Cart.Genre.Shooter({});
      case "simulation":
        return Cart.Genre.Simulation({});
      case "sports":
        return Cart.Genre.Sports({});
      case "strategy":
        return Cart.Genre.Strategy({});
      case "tool":
        return Cart.Genre.Tool({});
      default:
        throw unreachable(x);
    }
  }
}

function make_release_type(x: ReleaseType): Cart.Release_type {
  switch (x) {
    case "prototype":
      return Cart.Release_type.Prototype({});
    case "early-access":
      return Cart.Release_type.Early_access({});
    case "beta":
      return Cart.Release_type.Beta({});
    case "demo":
      return Cart.Release_type.Demo({});
    case "regular":
      return Cart.Release_type.Regular({});
    default:
      throw unreachable(x);
  }
}

function make_derivative_policy(x: DerivativePolicy): Cart.Derivative_policy {
  switch (x) {
    case "not-allowed":
      return Cart.Derivative_policy.Not_allowed({});
    case "personal-use":
      return Cart.Derivative_policy.Personal_use({});
    case "non-commercial-use":
      return Cart.Derivative_policy.Non_commercial_use({});
    case "commercial-use":
      return Cart.Derivative_policy.Commercial_use({});
  }
}

function make_date(x: CartDate) {
  return Cart.Date({ year: x.year, month: x.month, day: x.day });
}

function make_version(x: Version) {
  return Cart.Version({ major: x.major, minor: x.minor });
}

function make_rating(x: ContentRating) {
  switch (x) {
    case "general":
      return Cart.Content_rating.General({});
    case "teen-and-up":
      return Cart.Content_rating.Teen_and_up({});
    case "mature":
      return Cart.Content_rating.Mature({});
    case "explicit":
      return Cart.Content_rating.Explicit({});
    case "unknown":
      return Cart.Content_rating.Unknown({});
    default:
      throw unreachable(x);
  }
}

function make_input_method(x: InputMethod) {
  switch (x) {
    case "buttons":
      return Cart.Input_method.Buttons({});
    case "pointer":
      return Cart.Input_method.Pointer({});
    default:
      throw unreachable(x);
  }
}

function make_language(x: Language) {
  return Cart.Language({
    "iso-code": x.iso_code,
    interface: x.interface,
    audio: x.audio,
    text: x.text,
  });
}

function make_accessibility_provision(x: Accessibility) {
  switch (x) {
    case "configurable-difficulty":
      return Cart.Accessibility_provision.Configurable_difficulty({});
    case "high-contrast":
      return Cart.Accessibility_provision.High_contrast({});
    case "image-captions":
      return Cart.Accessibility_provision.Image_captions({});
    case "skippable-content":
      return Cart.Accessibility_provision.Skippable_content({});
    case "subtitles":
      return Cart.Accessibility_provision.Subtitles({});
    case "voiced-text":
      return Cart.Accessibility_provision.Voiced_text({});
    default:
      throw unreachable(x);
  }
}

function make_duration(x: Duration) {
  switch (x.unit) {
    case "seconds":
      return x.value;
    case "minutes":
      return x.value * 60;
    case "hours":
      return x.value * 60 * 60;
    default:
      throw unreachable(x.unit, "duration unit");
  }
}

export function make_absolute(path: string) {
  return Pathname.from_string(path).make_absolute().as_string();
}

function make_security(json: Kart["security"]) {
  return Cart.Security({
    capabilities: json.capabilities.map(make_capability),
  });
}

function make_capability(json: Capability) {
  switch (json.type) {
    case "open-urls": {
      return Cart.Capability.Contextual({
        capability: Cart.Contextual_capability.Open_URLs({}),
        reason: json.reason,
      });
    }

    case "request-device-files": {
      return Cart.Capability.Contextual({
        capability: Cart.Contextual_capability.Request_device_files({}),
        reason: json.reason,
      });
    }

    case "install-cartridges": {
      return Cart.Capability.Contextual({
        capability: Cart.Contextual_capability.Install_cartridges({}),
        reason: json.reason,
      });
    }

    case "download-files": {
      return Cart.Capability.Contextual({
        capability: Cart.Contextual_capability.Download_files({}),
        reason: json.reason,
      });
    }

    case "show-dialogs": {
      return Cart.Capability.Contextual({
        capability: Cart.Contextual_capability.Show_dialogs({}),
        reason: json.reason,
      });
    }

    case "store-temporary-files": {
      return Cart.Capability.Passive({
        capability: Cart.Passive_capability.Store_temporary_files({
          "max-size-mb": json.max_size_mb,
        }),
        optional: json.optional,
        reason: json.reason,
      });
    }

    case "sign-digitally": {
      return Cart.Capability.Contextual({
        capability: Cart.Contextual_capability.Sign_digitally({}),
        reason: json.reason,
      });
    }

    case "view-developer-profile": {
      return Cart.Capability.Contextual({
        capability: Cart.Contextual_capability.View_developer_profile({}),
        reason: json.reason,
      });
    }

    default:
      throw unreachable(json, "capability");
  }
}

function make_bridge(x: Bridge): Cart.Bridge[] {
  switch (x.type) {
    case "network-proxy": {
      return [
        Cart.Bridge.Network_proxy_v2({
          "allow-sync-access": x.sync_access ?? [],
        }),
      ];
    }

    case "local-storage-proxy": {
      return [Cart.Bridge.Local_storage_proxy({})];
    }

    case "input-proxy": {
      return make_bridge({
        type: "keyboard-input-proxy-v2",
        mapping: x.mapping,
        selector: "legacy",
      });
    }

    case "keyboard-input-proxy-v2": {
      return [
        Cart.Bridge.Keyboard_input_proxy_v2({
          mapping: new Map(Object.entries(get_mapping(x.mapping)).map(make_key_pair)),
          selector: make_keyboard_input_selector(x.selector),
        }),
      ];
    }

    case "preserve-webgl-render": {
      return [Cart.Bridge.Preserve_WebGL_render({})];
    }

    case "capture-canvas": {
      return [Cart.Bridge.Capture_canvas({ selector: x.selector })];
    }

    case "pointer-input-proxy": {
      return [
        Cart.Bridge.Pointer_input_proxy({
          selector: x.selector,
          "hide-cursor": x.hide_cursor,
        }),
      ];
    }

    case "indexeddb-proxy": {
      return [Cart.Bridge.IndexedDB_proxy({ versioned: x.versioned })];
    }

    case "renpy-web-tweaks": {
      return [Cart.Bridge.Renpy_web_tweaks({ version: Cart.Version(x.version) })];
    }

    case "external-url-handler": {
      return [Cart.Bridge.External_URL_handler({})];
    }

    case "resize-canvas": {
      return [Cart.Bridge.Resize_canvas({ selector: x.selector })];
    }

    default:
      throw unreachable(x, `Unknown bridge: ${(x as any).type}`);
  }
}

function make_keyboard_input_selector(x: string) {
  switch (x) {
    case "window":
      return Cart.Keyboard_input_selector.Window({});
    case "document":
      return Cart.Keyboard_input_selector.Document({});
    case "legacy":
      return Cart.Keyboard_input_selector.Legacy({});
    default:
      return Cart.Keyboard_input_selector.CSS({ selector: x });
  }
}

function get_mapping(x: KeyMapping) {
  if (typeof x === "string") {
    switch (x) {
      case "defaults":
        return {
          up: "ArrowUp",
          right: "ArrowRight",
          left: "ArrowLeft",
          down: "ArrowDown",
          x: "Escape",
          o: "Enter",
          sparkle: "KeyH",
          menu: "ShiftLeft",
          l: "PageUp",
          r: "PageDown",
        };

      case "kate":
        return {
          up: "ArrowUp",
          right: "ArrowRight",
          left: "ArrowLeft",
          down: "ArrowDown",
          x: "KeyX",
          o: "KeyZ",
          sparkle: "KeyC",
          menu: "ShiftLeft",
          l: "KeyA",
          r: "KeyS",
        };

      default:
        throw unreachable(x);
    }
  } else {
    return x;
  }
}

function make_key_pair([virtual, key_id]: [string, string]): [Cart.Virtual_key, Cart.Keyboard_key] {
  if (!keymap[key_id]) {
    throw new Error(`Unknown key code ${key_id}`);
  }
  return [
    make_virtual_key(virtual),
    Cart.Keyboard_key({
      code: key_id,
    }),
  ];
}

function make_virtual_key(key: string) {
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
    case "l":
      return Cart.Virtual_key.L_trigger({});
    case "r":
      return Cart.Virtual_key.R_trigger({});
    default:
      throw new Error(`Unknown virtual key ${key}`);
  }
}
