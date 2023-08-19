import * as Path from "path";
import * as FS from "fs";
import * as Crypto from "crypto";
import { Cart } from "./deps/schema";
import { enumerate, from_bytes, unreachable } from "./deps/util";
import * as Glob from "glob";
import { Spec as T } from "./deps/util";
const keymap = require("../assets/keymap.json") as {
  [key: string]: {
    key: string;
    code: string;
    key_code: number;
  };
};

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

const release_type = T.one_of([
  "prototype",
  "early-access",
  "beta",
  "demo",
  "regular",
] as const);

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

const valid_id = T.regex(
  "valid id",
  /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/
);
const valid_language = T.regex(
  "valid ISO language code",
  /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/
);

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
      genre: T.optional(
        ["other"],
        T.seq2(T.list_of(genre), T.min_max_items(1, 10))
      ) as (_: any) => Genre[],
      tags: T.optional(
        [],
        T.seq2(T.list_of(T.short_str(255)), T.min_max_items(0, 10))
      ) as (_: any) => string[],
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
    save_data: T.optional(
      "versioned",
      T.one_of(["versioned" as const, "unversioned" as const])
    ),
    renpy_version: T.regex(
      "version in the form MM.NN (e.g.: 7.5, 8.1)",
      /^\d+\.\d+$/
    ),
    hide_cursor: T.optional(false, T.bool),
    open_urls_reason: T.optional(null, T.short_str(255)),
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
});

const security = T.spec({
  capabilities: T.optional([], T.list_of(capability)),
});

const config = T.spec({
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
  security: security,
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

type Kart = ReturnType<typeof config>;

type Genre =
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

type CartDate = { year: number; month: number; day: number };

type Version = { major: number; minor: number };

type ReleaseType = "prototype" | "early-access" | "beta" | "demo" | "regular";

type ContentRating =
  | "general"
  | "teen-and-up"
  | "mature"
  | "explicit"
  | "unknown";

type DerivativePolicy = ReturnType<typeof derivative_policy>;

type Duration = {
  unit: "seconds" | "minutes" | "hours";
  value: number;
};

type InputMethod = "buttons" | "pointer";

type Language = {
  iso_code: string;
  interface: boolean;
  audio: boolean;
  text: boolean;
};

type Accessibility =
  | "high-contrast"
  | "subtitles"
  | "image-captions"
  | "voiced-text"
  | "configurable-difficulty"
  | "skippable-content";

type BookletExpr = unknown;

type KartPlatform = KPWeb;

type KPWeb = {
  type: "web-archive";
  html: string;
  bridges: Bridge[];
};

type KeyMapping = { [key: string]: string } | "defaults" | "kate";

type Capability = ContextualCapability & { reason: string };

type ContextualCapability =
  | { type: "open-urls" }
  | { type: "request-device-files" }
  | { type: "install-cartridges" }
  | { type: "download-files" };

type Bridge =
  | { type: "network-proxy" }
  | { type: "local-storage-proxy" }
  | {
      type: "input-proxy";
      mapping: KeyMapping;
    }
  | { type: "preserve-webgl-render" }
  | { type: "capture-canvas"; selector: string }
  | { type: "pointer-input-proxy"; selector: string; hide_cursor: boolean }
  | { type: "indexeddb-proxy"; versioned: boolean }
  | { type: "renpy-web-tweaks"; version: { major: number; minor: number } }
  | { type: "external-url-handler" };

type Recipe =
  | { type: "identity" }
  | {
      type: "renpy";
      pointer_support: boolean;
      save_data: "versioned" | "unversioned";
      hide_cursor: boolean;
      open_urls_reason: string | null;
      renpy_version: string;
    }
  | { type: "bitsy" };

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

function assert_base(path: string, root: string) {
  const file = FS.realpathSync(path);
  if (!file.startsWith(root)) {
    throw new Error(
      `Cannot load file '${file}' because it's outside of the base directory '${root}'`
    );
  }
  return file;
}

function load_file(path0: string, root: string, base_dir: string) {
  const path = Path.resolve(base_dir, path0);
  return new Uint8Array(FS.readFileSync(assert_base(path, root)));
}

function load_text_file(path0: string, root: string, base_dir: string) {
  const path = Path.resolve(base_dir, path0);
  return FS.readFileSync(assert_base(path, root), "utf-8");
}

function assert_file_exists(path0: string, root: string, base_dir: string) {
  const path = Path.resolve(base_dir, path0);
  if (!FS.existsSync(path)) {
    throw new Error(`Missing file ${path0} in ${root}`);
  }
}

function maybe_load_text_file(
  path: string | null,
  root: string,
  base_dir: string
) {
  if (path == null) {
    return "";
  } else {
    return load_text_file(path, root, base_dir);
  }
}

function metadata(x: Kart["metadata"], root: string, base_dir: string) {
  if (x.presentation.thumbnail_path != null) {
    assert_file_exists(x.presentation.thumbnail_path, root, base_dir);
  }
  if (x.presentation.banner_path != null) {
    assert_file_exists(x.presentation.banner_path, root, base_dir);
  }
  if (x.legal?.licence_path != null) {
    assert_file_exists(x.legal.licence_path, root, base_dir);
  }
  if (x.legal?.privacy_policy_path != null) {
    assert_file_exists(x.legal.privacy_policy_path, root, base_dir);
  }

  const presentation = Cart.Metadata.Presentation({
    title: x.presentation.title,
    author: x.presentation.author,
    tagline: x.presentation.tagline,
    description: x.presentation.description,
    "release-type": make_release_type(x.presentation.release_type),
    "thumbnail-path": x.presentation.thumbnail_path
      ? make_absolute(x.presentation.thumbnail_path)
      : null,
    "banner-path": x.presentation.banner_path
      ? make_absolute(x.presentation.banner_path)
      : null,
  });

  const classification = Cart.Metadata.Classification({
    genre: x.classification?.genre.map(make_genre) ?? [],
    tags: x.classification?.tags ?? [],
    rating: make_rating(x.classification?.rating ?? "unknown"),
    warnings: x.classification?.warnings ?? null,
  });

  const legal = Cart.Metadata.Legal({
    "derivative-policy": make_derivative_policy(
      x.legal?.derivative_policy ?? "personal-use"
    ),
    "licence-path": x.legal?.licence_path
      ? make_absolute(x.legal.licence_path)
      : null,
    "privacy-policy-path": x.legal?.privacy_policy_path
      ? make_absolute(x.legal.privacy_policy_path)
      : null,
  });

  const accessibility = Cart.Metadata.Accessibility({
    "input-methods":
      x.accessibility?.input_methods.map(make_input_method) ?? [],
    languages: x.accessibility?.languages.map(make_language) ?? [],
    provisions:
      x.accessibility?.provisions.map(make_accessibility_provision) ?? [],
    "average-completion-seconds": x.accessibility?.average_completion
      ? make_duration(x.accessibility.average_completion)
      : null,
    "average-session-seconds": x.accessibility?.average_session
      ? make_duration(x.accessibility.average_session)
      : null,
  });

  return [presentation, classification, legal, accessibility];
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

function make_absolute(path: string) {
  if (path.startsWith("/")) {
    return path;
  } else {
    return `/${path}`;
  }
}

async function files(patterns: Kart["files"], root: string, base_dir: string) {
  const paths = [
    ...new Set(patterns.flatMap((x) => Glob.sync(x, { cwd: base_dir }))),
  ];

  const result: Cart.File[] = [];
  for (const path of paths) {
    if (FS.statSync(Path.resolve(base_dir, path)).isFile()) {
      const ext = Path.extname(path);
      const mime = mime_table[ext] ?? "application/octet-stream";
      const data = load_file(path, root, base_dir);
      const integrity = await Crypto.subtle.digest("SHA-256", data.buffer);
      result.push(
        Cart.File({
          path: make_absolute(path),
          mime: mime,
          integrity: new Uint8Array(integrity),
          data: load_file(path, root, base_dir),
        })
      );
    }
  }

  return result;
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

    default:
      throw unreachable(json, "capability");
  }
}

function save(cartridge: Cart.Cartridge, output: string) {
  const bytes = Cart.encode(cartridge);
  console.log(`> Total size: ${from_bytes(bytes.byteLength)}`);
  FS.writeFileSync(output, bytes);
}

function make_bridge(x: Bridge): Cart.Bridge[] {
  switch (x.type) {
    case "network-proxy": {
      return [Cart.Bridge.Network_proxy({})];
    }

    case "local-storage-proxy": {
      return [Cart.Bridge.Local_storage_proxy({})];
    }

    case "input-proxy": {
      return [
        Cart.Bridge.Input_proxy({
          mapping: new Map(
            Object.entries(get_mapping(x.mapping)).map(make_key_pair)
          ),
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
      return [
        Cart.Bridge.Renpy_web_tweaks({ version: Cart.Version(x.version) }),
      ];
    }

    case "external-url-handler": {
      return [Cart.Bridge.External_URL_handler({})];
    }

    default:
      throw unreachable(x, `Unknown bridge: ${(x as any).type}`);
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

function make_key_pair([virtual, key_id]: [string, string]): [
  Cart.Virtual_key,
  Cart.Keyboard_key
] {
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
    case "l":
      return Cart.Virtual_key.L_trigger({});
    case "r":
      return Cart.Virtual_key.R_trigger({});
    default:
      throw new Error(`Unknown virtual key ${key}`);
  }
}

function apply_recipe(
  json: ReturnType<typeof config>
): ReturnType<typeof config> {
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
            { type: "input-proxy", mapping: "kate" },
            { type: "capture-canvas", selector: "#game" },
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
            { type: "input-proxy", mapping: "defaults" },
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
    default:
      throw unreachable(recipe, "Recipe");
  }
}

function renpy_version(x: string) {
  const [_, major, minor] = x.match(/^(\d+)\.(\d+)$/)!;
  return { major: Number(major), minor: Number(minor) };
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

export async function make_cartridge(path: string, output: string) {
  let base_dir = Path.dirname(Path.resolve(path));
  const dir_root = base_dir;
  const json0: unknown = JSON.parse(FS.readFileSync(path, "utf-8"));
  const json1 = T.parse(config, json0);
  const json = apply_recipe(json1);
  show_details(json);

  const x = json.platform;
  if (json.root != null) {
    const new_base_dir = Path.resolve(base_dir, json.root);
    assert_base(new_base_dir, dir_root);
    base_dir = new_base_dir;
  }

  const meta = metadata(json.metadata, dir_root, base_dir);
  const archive = await files(json.files, dir_root, base_dir);
  show_archive(archive);

  assert_file_exists(x.html, dir_root, base_dir);

  switch (x.type) {
    case "web-archive": {
      save(
        Cart.Cartridge({
          id: json.id,
          version: make_version(json.version),
          "release-date": make_date(json.release),
          metadata: meta,
          runtime: Cart.Runtime.Web_archive({
            "html-path": make_absolute(x.html),
            bridges: x.bridges.flatMap(make_bridge),
          }),
          security: make_security(json.security),
          files: archive,
        }),
        output
      );
      break;
    }

    default:
      throw new Error(`Unsupported type ${(x as any).type}`);
  }
}

function show_details(json: unknown) {
  console.log(`> Cartridge build rules:\n${JSON.stringify(json, null, 2)}\n`);
}

function show_archive(archive: Cart.File[]) {
  console.log(`> Cartridge contents:\n`);
  for (const file of archive) {
    console.log(`:: ${file.path} (${from_bytes(file.data.byteLength)})`);
  }
  console.log("");
}
