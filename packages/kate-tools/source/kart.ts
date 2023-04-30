import * as Path from "path";
import * as FS from "fs";
import { Cart } from "./deps/schema";
import { unreachable } from "./deps/util";
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
  "full",
] as const);

const content_rating = T.one_of([
  "general",
  "teen-and-up",
  "mature",
  "explicit",
  "unknown",
] as const);

const duration = T.one_of([
  "seconds",
  "few-minutes",
  "half-hour",
  "few-hours",
  "several-hours",
  "unknown",
] as const);

const input_method = T.one_of(["kate-buttons", "touch"] as const);

const accessibility = T.one_of([
  "high-contrast",
  "subtitles",
  "image-captions",
  "voiced-text",
  "configurable-difficulty",
  "skippable-content",
] as const);

const player_range = T.spec({
  minimum: T.int,
  maximum: T.int,
});

const valid_id = T.regex(
  "valid id",
  /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/
);
const valid_language = T.regex(
  "valid ISO language code",
  /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/
);

const meta = T.spec({
  game: T.spec({
    author: T.short_str(255),
    title: T.short_str(255),
    description: T.optional("", T.short_str(10_000)),
    genre: T.optional(
      ["other"],
      T.seq2(T.list_of(genre), T.min_max_items(1, 10))
    ) as (_: any) => Genre[],
    tags: T.optional(
      [],
      T.seq2(T.list_of(T.short_str(255)), T.min_max_items(1, 10))
    ) as (_: any) => string[],
    thumbnail_path: T.nullable(T.str),
  }),
  release: T.nullable(
    T.spec({
      kind: T.optional("full", release_type),
      date: T.lazy_optional(
        today,
        T.spec({
          year: T.int,
          month: T.int,
          day: T.int,
        })
      ),
      version: T.optional(
        { major: 1, minor: 0 },
        T.spec({
          major: T.int,
          minor: T.int,
        })
      ),
      legal_notices_path: T.nullable(T.str),
      licence_name: T.optional("All rights reserved", T.short_str(1_000)),
      allow_derivative: T.optional(false, T.bool),
      allow_commercial: T.optional(false, T.bool),
    })
  ),
  rating: T.nullable(
    T.spec({
      rating: T.optional("unknown", content_rating),
      warnings: T.nullable(T.short_str(1_000)),
    })
  ),
  play_style: T.nullable(
    T.spec({
      input_methods: T.optional([], T.list_of(input_method)),
      local_multiplayer: T.nullable(player_range),
      online_multiplayer: T.nullable(player_range),
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
      accessibility: T.optional([], T.list_of(accessibility)),
      average_duration: T.optional("unknown", duration),
    })
  ),
});

const bridges: (_: any) => Bridge = T.tagged_choice("type", {
  "network-proxy": T.spec({
    type: T.constant("network-proxy"),
  }),
  "local-storage-proxy": T.spec({
    type: T.constant("local-storage-proxy"),
  }),
  "input-proxy": T.spec({
    type: T.constant("input-proxy"),
    mapping: T.or3(
      T.constant("defaults"),
      T.constant("kate"),
      T.dictionary(T.str)
    ),
  }),
  "preserve-webgl-render": T.spec({
    type: T.constant("preserve-webgl-render"),
  }),
  "capture-canvas": T.spec({
    type: T.constant("capture-canvas"),
    selector: T.short_str(1_000),
  }),
}) as any;

const platform_web = T.spec({
  type: T.constant("web-archive"),
  html: T.str,
  bridges: T.optional([], T.list_of(bridges)),
});

const config = T.spec({
  id: T.seq2(T.short_str(255), valid_id),
  root: T.nullable(T.str),
  metadata: meta,
  files: T.list_of(T.str),
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
  | "interactive-fiction"
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

type ReleaseType = "prototype" | "early-access" | "beta" | "demo" | "full";

type ContentRating =
  | "general"
  | "teen-and-up"
  | "mature"
  | "explicit"
  | "unknown";

type Duration =
  | "seconds"
  | "few-minutes"
  | "half-hour"
  | "one-hour"
  | "few-hours"
  | "several-hours"
  | "unknown";

type InputMethod = "kate-buttons" | "touch";

type PlayerRange = { minimum: number; maximum: number };

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

type Bridge =
  | { type: "network-proxy" }
  | { type: "local-storage-proxy" }
  | {
      type: "input-proxy";
      mapping: KeyMapping;
    }
  | { type: "preserve-webgl-render" }
  | { type: "capture-canvas"; selector: string };

const mime_table = Object.assign(Object.create(null), {
  ".png": "image/png",
  ".json": "application/json",
  ".html": "text/html",
  ".m4a": "audio/mp4",
  ".js": "text/javascript",
  ".css": "text/css",
  ".txt": "text/plain",
  ".zip": "application/zip",
  ".wasm": "application/wasm",
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
  const game = Cart.Meta_title({
    author: x.game.author,
    title: x.game.title,
    description: x.game.description,
    genre: x.game.genre.map(make_genre),
    tags: x.game.tags,
    thumbnail: Cart.File({
      path: "thumbnail.png",
      mime: "image/png",
      data: x.game.thumbnail_path
        ? load_file(x.game.thumbnail_path, root, base_dir)
        : new Uint8Array(
            FS.readFileSync(
              Path.join(__dirname, "../assets/default-thumbnail.png")
            )
          ),
    }),
  });

  const release = Cart.Meta_release({
    "release-type": make_release_type(x.release?.kind ?? "full"),
    "release-date": make_date(x.release?.date ?? today()),
    version: make_version(x.release?.version ?? { major: 1, minor: 0 }),
    "legal-notices": maybe_load_text_file(
      x.release?.legal_notices_path ?? null,
      root,
      base_dir
    ),
    "licence-name": x.release?.licence_name ?? "Proprietary",
    "allow-commercial": x.release?.allow_commercial ?? false,
    "allow-derivative": x.release?.allow_derivative ?? false,
  });

  const rating = Cart.Meta_rating({
    rating: make_rating(x.rating?.rating ?? "unknown"),
    warnings: x.rating?.warnings ?? null,
  });

  const play = Cart.Meta_play({
    "input-methods": x.play_style?.input_methods.map(make_input_method) ?? [],
    "local-multiplayer": x.play_style?.local_multiplayer
      ? make_player_range(x.play_style.local_multiplayer)
      : null,
    "online-multiplayer": x.play_style?.online_multiplayer
      ? make_player_range(x.play_style.online_multiplayer)
      : null,
    languages: x.play_style?.languages.map(make_language) ?? [],
    accessibility: x.play_style?.accessibility.map(make_accessibility) ?? [],
    "average-duration": make_duration(
      x.play_style?.average_duration ?? "unknown"
    ),
  });

  const extras: any[] = [];

  const security = Cart.Meta_security({ capabilities: [] });

  return Cart.Metadata({
    title: game,
    release,
    rating,
    play,
    security,
    extras,
  });
}

function make_genre(x: Genre): Cart.Genre {
  if (x == null) {
    return Cart.Genre.Not_specified({});
  } else {
    switch (x) {
      case "action":
        return Cart.Genre.Action({});
      case "fighting":
        return Cart.Genre.Figthing({});
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
    case "full":
      return Cart.Release_type.Full({});
    default:
      throw unreachable(x);
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
    case "kate-buttons":
      return Cart.Input_method.Kate_buttons({});
    case "touch":
      return Cart.Input_method.Touch({});
    default:
      throw unreachable(x);
  }
}

function make_player_range(x: PlayerRange | null) {
  if (x == null) {
    return null;
  } else {
    return Cart.Player_range({ minimum: x.minimum, maximum: x.maximum });
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

function make_accessibility(x: Accessibility) {
  switch (x) {
    case "configurable-difficulty":
      return Cart.Accessibility.Configurable_difficulty({});
    case "high-contrast":
      return Cart.Accessibility.High_contrast({});
    case "image-captions":
      return Cart.Accessibility.Image_captions({});
    case "skippable-content":
      return Cart.Accessibility.Skippable_content({});
    case "subtitles":
      return Cart.Accessibility.Subtitles({});
    case "voiced-text":
      return Cart.Accessibility.Voiced_text({});
    default:
      throw unreachable(x);
  }
}

function make_duration(x: Duration) {
  switch (x) {
    case "seconds":
      return Cart.Duration.Seconds({});
    case "few-minutes":
      return Cart.Duration.Few_minutes({});
    case "half-hour":
      return Cart.Duration.Half_hour({});
    case "one-hour":
      return Cart.Duration.One_hour({});
    case "few-hours":
      return Cart.Duration.Few_hours({});
    case "several-hours":
      return Cart.Duration.Several_hours({});
    case "unknown":
      return Cart.Duration.Unknown({});
    default:
      throw unreachable(x);
  }
}

function make_absolute(path: string) {
  if (path.startsWith("/")) {
    return path;
  } else {
    return `/${path}`;
  }
}

function files(patterns: Kart["files"], root: string, base_dir: string) {
  const paths = [
    ...new Set(patterns.flatMap((x) => Glob.sync(x, { cwd: base_dir }))),
  ];
  return paths.flatMap((path) => {
    if (FS.statSync(Path.resolve(base_dir, path)).isFile()) {
      const ext = Path.extname(path);
      const mime = mime_table[ext] ?? "application/octet-stream";
      return [
        Cart.File({
          path: make_absolute(path),
          mime: mime,
          data: load_file(path, root, base_dir),
        }),
      ];
    } else {
      return [];
    }
  });
}

function save(cart: Cart.Cartridge, output: string) {
  const bytes = Cart.encode(cart);
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
      return [Cart.Bridge.Preserve_webgl_render({})];
    }

    case "capture-canvas": {
      return [Cart.Bridge.Capture_canvas({ selector: x.selector })];
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
          capture: "ControlLeft",
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
          capture: "ControlLeft",
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
  Cart.VirtualKey,
  Cart.KeyboardKey
] {
  const { key, code, key_code } = keymap[key_id];
  return [
    make_virtual_key(virtual),
    Cart.KeyboardKey({
      key: key,
      code: code,
      "key-code": Math.floor(key_code),
    }),
  ];
}

function make_virtual_key(key: string) {
  switch (key) {
    case "up":
      return Cart.VirtualKey.Up({});
    case "right":
      return Cart.VirtualKey.Right({});
    case "down":
      return Cart.VirtualKey.Down({});
    case "left":
      return Cart.VirtualKey.Left({});
    case "menu":
      return Cart.VirtualKey.Menu({});
    case "capture":
      return Cart.VirtualKey.Capture({});
    case "x":
      return Cart.VirtualKey.X({});
    case "o":
      return Cart.VirtualKey.O({});
    case "l":
      return Cart.VirtualKey.L_trigger({});
    case "r":
      return Cart.VirtualKey.R_trigger({});
    default:
      throw new Error(`Unknown virtual key ${key}`);
  }
}

export function make_cartridge(path: string, output: string) {
  let base_dir = Path.dirname(Path.resolve(path));
  const dir_root = base_dir;
  const json0: unknown = JSON.parse(FS.readFileSync(path, "utf-8"));
  const json = T.parse(config, json0);
  const x = json.platform;
  if (json.root != null) {
    const new_base_dir = Path.resolve(base_dir, json.root);
    assert_base(new_base_dir, dir_root);
    base_dir = new_base_dir;
  }

  const meta = metadata(json.metadata, dir_root, base_dir);
  const archive = files(json.files, dir_root, base_dir);

  switch (x.type) {
    case "web-archive": {
      save(
        Cart.Cartridge({
          id: json.id,
          metadata: meta,
          files: archive,
          platform: Cart.Platform.Web_archive({
            html: load_text_file(x.html, dir_root, base_dir),
            bridges: x.bridges.flatMap(make_bridge),
          }),
        }),
        output
      );
      break;
    }

    default:
      throw new Error(`Unsupported type ${(x as any).type}`);
  }
}
