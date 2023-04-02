import * as Path from "path";
import * as FS from "fs";
import { Cart, add_fingerprint } from "./deps/schema";
import { unreachable } from "./deps/util";
import * as Glob from "glob";

type Kart = {
  id: string;
  root?: string;
  metadata: {
    game: {
      author: string;
      title: string;
      description: string;
      genre: Genre[];
      tags: string[];
      thumbnail_path: string;
    };
    release: {
      kind: ReleaseType;
      date: CartDate;
      version: Version;
      legal_notices_path: string | null;
      licence_name: string;
      allow_derivative: boolean;
      allow_commercial: boolean;
    };
    rating: {
      rating: ContentRating;
      warnings: string[];
    };
    play_style: {
      input_methods: InputMethod[];
      local_multiplayer: PlayerRange | null;
      online_multiplayer: PlayerRange | null;
      languages: Language[];
      accessibility: Accessibility[];
      average_duration: Duration;
    };
    extras: never[];
  };
  files: string[];
  platform: KartPlatform;
};

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

type ContentRating = "general" | "teen-and-up" | "mature" | "explicit";

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

type KPWeb =
  | {
      type: "web";
      url: string;
      width: number;
      height: number;
    }
  | {
      type: "web-archive";
      html: string;
      bridges: Bridge[];
    };

type KeyboardKey = {
  key: string;
  code: string;
  key_code: number;
};

type Bridge =
  | { type: "standard-network" }
  | { type: "local-storage" }
  | {
      type: "input-proxy";
      mapping: { [key: string]: KeyboardKey } | "defaults";
    }
  | { type: "rpgmaker-mv" }
  | { type: "preserve-webgl-render" };

class J<T extends { [key: string]: any }> {
  constructor(readonly value: T, readonly path: string[]) {}

  static from<T extends { [key: string]: any }>(x: T) {
    return new J(x, []);
  }

  fail(key: any, msg: string) {
    const fullpath = [...this.path, key].join(".");
    throw new Error(`${msg} at ${fullpath}`);
  }

  leaf<K extends keyof T>(k: K) {
    const v = this.get(k);
    return new J({ x: v }, [...this.path, k as any]);
  }

  at<K extends keyof T>(k: K) {
    const v = this.get(k);
    if (v == null || typeof v !== "object") {
      throw this.fail(k as string, `not an object`);
    } else {
      return new J<T[K]>(v as any, [...this.path, k as any]);
    }
  }

  get<K extends keyof T>(k: K) {
    if (k in this.value) {
      return this.value[k];
    } else {
      throw this.fail(k, `missing key`);
    }
  }

  int<K extends keyof T>(k: K) {
    const v = this.get(k);
    if (typeof v !== "number" || v !== (v | 0)) {
      throw this.fail(k, `not an integer`);
    } else {
      return v;
    }
  }

  bool<K extends keyof T>(k: K) {
    const v = this.get(k);
    if (typeof v !== "boolean") {
      throw this.fail(k, `not a boolean`);
    } else {
      return v;
    }
  }

  str<K extends keyof T>(k: K) {
    const v = this.get(k);
    if (typeof v !== "string") {
      throw this.fail(k, `not a string`);
    } else {
      return v;
    }
  }

  str_opt<K extends keyof T>(k: K) {
    const v = this.get(k);
    if (typeof v !== "string" && v != null) {
      throw this.fail(k, `not a string or null`);
    } else {
      return v;
    }
  }

  str_list<K extends keyof T>(k: K): string[] {
    const v = this.get(k);
    if (!Array.isArray(v)) {
      throw this.fail(k, `not an array`);
    } else if (!v.every((x: any) => typeof x === "string")) {
      throw this.fail(k, `not an array of strings`);
    }
    return v;
  }

  map<K extends keyof T, B>(
    k: K,
    fn: (_: T[K][0], v: J<T[K]>, i: number) => B
  ): B[] {
    const v = this.get(k);
    if (!Array.isArray(v)) {
      throw this.fail(k, `not an array`);
    } else {
      const j = this.at(k);
      return (v as T[K][]).map((x, i) => {
        return fn(x, j, i);
      });
    }
  }

  mapj<K extends keyof T, B>(k: K, fn: (_: J<T[K][0]>) => B): B[] {
    const v = this.get(k);
    if (!Array.isArray(v)) {
      throw this.fail(k, `not an array`);
    } else {
      const j = this.at(k);
      return (v as T[K][]).map((x, i) => {
        return fn(new J(x, [...this.path, String(i)]));
      });
    }
  }
}

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

function metadata(x: J<Kart["metadata"]>, root: string, base_dir: string) {
  const xgame = x.at("game");
  const game = new Cart.Meta_title(
    xgame.str("author"),
    xgame.str("title"),
    xgame.str("description"),
    xgame.map("genre", make_genre),
    xgame.str_list("tags"),
    new Cart.File(
      "thumbnail.png",
      "image/png",
      load_file(xgame.str("thumbnail_path"), root, base_dir)
    )
  );
  const xrel = x.at("release");
  const release = new Cart.Meta_release(
    make_release_type(xrel.leaf("kind")),
    make_date(xrel.at("date")),
    make_version(xrel.at("version")),
    maybe_load_text_file(xrel.str_opt("legal_notices_path"), root, base_dir),
    xrel.str("licence_name"),
    xrel.bool("allow_derivative"),
    xrel.bool("allow_commercial")
  );

  const xrat = x.at("rating");
  const rating = new Cart.Meta_rating(
    make_rating(xrat.leaf("rating")),
    xrat.str_list("warnings")
  );

  const xp = x.at("play_style");
  const play = new Cart.Meta_play(
    xp.map("input_methods", make_input_method),
    make_player_range(xp.leaf("local_multiplayer")),
    make_player_range(xp.leaf("online_multiplayer")),
    xp.mapj("languages", make_language),
    xp.map("accessibility", make_accessibility),
    make_duration(xp.leaf("average_duration"))
  );

  const extras: any[] = [];

  const security = new Cart.Meta_security([]);

  return new Cart.Metadata(game, release, rating, play, security, extras);
}

function make_genre(x: Genre, j: J<any>, i: number): Cart.Genre {
  if (x == null) {
    return new Cart.Genre.Not_specified();
  } else {
    switch (x) {
      case "action":
        return new Cart.Genre.Action();
      case "fighting":
        return new Cart.Genre.Figthing();
      case "interactive-fiction":
        return new Cart.Genre.Interactive_fiction();
      case "platformer":
        return new Cart.Genre.Platformer();
      case "other":
        return new Cart.Genre.Other();
      case "puzzle":
        return new Cart.Genre.Puzzle();
      case "racing":
        return new Cart.Genre.Racing();
      case "rhythm":
        return new Cart.Genre.Rhythm();
      case "rpg":
        return new Cart.Genre.RPG();
      case "shooter":
        return new Cart.Genre.Shooter();
      case "simulation":
        return new Cart.Genre.Simulation();
      case "sports":
        return new Cart.Genre.Sports();
      case "strategy":
        return new Cart.Genre.Strategy();
      case "tool":
        return new Cart.Genre.Tool();
      default:
        j.fail(String(i), `not a genre: ${x}`);
        throw unreachable(x);
    }
  }
}

function make_release_type(j: J<{ x: ReleaseType }>): Cart.Release_type {
  const x = j.get("x");
  switch (x) {
    case "prototype":
      return new Cart.Release_type.Prototype();
    case "early-access":
      return new Cart.Release_type.Early_access();
    case "beta":
      return new Cart.Release_type.Beta();
    case "demo":
      return new Cart.Release_type.Demo();
    case "full":
      return new Cart.Release_type.Full();
    default:
      j.fail(null, "not a valid release type");
      throw unreachable(x);
  }
}

function make_date(x: J<CartDate>) {
  return new Cart.Date(x.int("year"), x.int("month"), x.int("day"));
}

function make_version(x: J<Version>) {
  return new Cart.Version(x.int("major"), x.int("minor"));
}

function make_rating(j: J<{ x: ContentRating }>) {
  const x = j.get("x");
  switch (x) {
    case "general":
      return new Cart.Content_rating.General();
    case "teen-and-up":
      return new Cart.Content_rating.Teen_and_up();
    case "mature":
      return new Cart.Content_rating.Mature();
    case "explicit":
      return new Cart.Content_rating.Explicit();
    default:
      j.fail(null, "not a valid rating");
      throw unreachable(x);
  }
}

function make_input_method(x: InputMethod, j: J<any>, i: number) {
  switch (x) {
    case "kate-buttons":
      return new Cart.Input_method.Kate_buttons();
    case "touch":
      return new Cart.Input_method.Touch();
    default:
      j.fail(String(i), "not a valid input method");
      throw unreachable(x);
  }
}

function make_player_range(x0: J<{ x: PlayerRange | null }>) {
  if (x0.get("x") == null) {
    return null;
  } else {
    const x = x0.at("x") as J<PlayerRange>;
    return new Cart.Player_range(x.int("minimum"), x.int("maximum"));
  }
}

function make_language(x: J<Language>) {
  return new Cart.Language(
    x.str("iso_code"), // TODO: check iso code
    x.bool("interface"),
    x.bool("audio"),
    x.bool("text")
  );
}

function make_accessibility(x: Accessibility, jj: J<any>, i: number) {
  switch (x) {
    case "configurable-difficulty":
      return new Cart.Accessibility.Configurable_difficulty();
    case "high-contrast":
      return new Cart.Accessibility.High_contrast();
    case "image-captions":
      return new Cart.Accessibility.Image_captions();
    case "skippable-content":
      return new Cart.Accessibility.Skippable_content();
    case "subtitles":
      return new Cart.Accessibility.Subtitles();
    case "voiced-text":
      return new Cart.Accessibility.Voiced_text();
    default:
      jj.fail(String(i), "not a valid accessibility feature");
      throw unreachable(x);
  }
}

function make_duration(j: J<{ x: Duration }>) {
  const x = j.get("x");
  switch (x) {
    case "seconds":
      return new Cart.Duration.Seconds();
    case "few-minutes":
      return new Cart.Duration.Few_minutes();
    case "half-hour":
      return new Cart.Duration.Half_hour();
    case "one-hour":
      return new Cart.Duration.One_hour();
    case "few-hours":
      return new Cart.Duration.Few_hours();
    case "several-hours":
      return new Cart.Duration.Several_hours();
    case "unknown":
      return new Cart.Duration.Unknown();
    default:
      j.fail(null, "not a valid duration");
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
        new Cart.File(
          make_absolute(path),
          mime,
          load_file(path, root, base_dir)
        ),
      ];
    } else {
      return [];
    }
  });
}

function save(cart: Cart.Cartridge, output: string) {
  const encoder = new Cart._Encoder();
  cart.encode(encoder);
  FS.writeFileSync(output, add_fingerprint(encoder.to_bytes()));
}

function make_bridge(x: Bridge): Cart.Bridge[] {
  switch (x.type) {
    case "standard-network": {
      return [new Cart.Bridge.Network_proxy()];
    }

    case "local-storage": {
      return [new Cart.Bridge.Local_storage_proxy()];
    }

    case "input-proxy": {
      return [
        new Cart.Bridge.Input_proxy(
          new Map(Object.entries(get_mapping(x.mapping)).map(make_key_pair))
        ),
      ];
    }

    case "rpgmaker-mv": {
      const key_map = new Map<Cart.VirtualKey, Cart.KeyboardKey>([
        [
          new Cart.VirtualKey.Up(),
          new Cart.KeyboardKey("ArrowUp", "ArrowUp", 38),
        ],
        [
          new Cart.VirtualKey.Right(),
          new Cart.KeyboardKey("ArrowRight", "ArrowRight", 39),
        ],
        [
          new Cart.VirtualKey.Down(),
          new Cart.KeyboardKey("ArrowDown", "ArrowDown", 40),
        ],
        [
          new Cart.VirtualKey.Left(),
          new Cart.KeyboardKey("ArrowLeft", "ArrowLeft", 37),
        ],
        [new Cart.VirtualKey.O(), new Cart.KeyboardKey("z", "KeyZ", 90)],
        [new Cart.VirtualKey.X(), new Cart.KeyboardKey("x", "KeyX", 88)],
        [
          new Cart.VirtualKey.L_trigger(),
          new Cart.KeyboardKey("PageUp", "PageUp", 33),
        ],
        [
          new Cart.VirtualKey.R_trigger(),
          new Cart.KeyboardKey("PageDown", "PageDown", 34),
        ],
      ]);
      return [
        new Cart.Bridge.Local_storage_proxy(),
        new Cart.Bridge.Network_proxy(),
        new Cart.Bridge.Input_proxy(key_map),
      ];
    }

    case "preserve-webgl-render": {
      return [new Cart.Bridge.Preserve_render()];
    }

    default:
      throw unreachable(x, `Unknown bridge: ${(x as any).type}`);
  }
}

function get_mapping(x: "defaults" | { [key: string]: KeyboardKey }) {
  if (x === "defaults") {
    return {
      up: { key: "ArrowUp", code: "ArrowUp", key_code: 38 },
      right: { key: "ArrowRight", code: "ArrowRight", key_code: 39 },
      down: { key: "ArrowDown", code: "ArrowDown", key_code: 40 },
      left: { key: "ArrowLeft", code: "ArrowLeft", key_code: 37 },
      x: { key: "Escape", code: "Escape", key_code: 27 },
      o: { key: "Enter", code: "Enter", key_code: 13 },
      menu: { key: "Shift", code: "ShiftLeft", key_code: 16 },
      capture: { key: "Control", code: "ControlLeft", key_code: 17 },
      l: { key: "PageUp", code: "PageUp", key_code: 33 },
      r: { key: "PageDown", code: "PageDown", key_code: 34 },
    };
  } else {
    return x;
  }
}

function make_key_pair([virtual, { key, code, key_code }]: [
  string,
  KeyboardKey
]): [Cart.VirtualKey, Cart.KeyboardKey] {
  return [
    make_virtual_key(virtual),
    new Cart.KeyboardKey(key, code, Math.floor(key_code)),
  ];
}

function make_virtual_key(key: string) {
  switch (key) {
    case "up":
      return new Cart.VirtualKey.Up();
    case "right":
      return new Cart.VirtualKey.Right();
    case "down":
      return new Cart.VirtualKey.Down();
    case "left":
      return new Cart.VirtualKey.Left();
    case "menu":
      return new Cart.VirtualKey.Menu();
    case "capture":
      return new Cart.VirtualKey.Capture();
    case "x":
      return new Cart.VirtualKey.X();
    case "o":
      return new Cart.VirtualKey.O();
    case "l":
      return new Cart.VirtualKey.L_trigger();
    case "r":
      return new Cart.VirtualKey.R_trigger();
    default:
      throw new Error(`Unknown virtual key ${key}`);
  }
}

export function make_cartridge(path: string, output: string) {
  let base_dir = Path.dirname(Path.resolve(path));
  const dir_root = base_dir;
  const json: Kart = JSON.parse(FS.readFileSync(path, "utf-8"));
  const x = json.platform;
  if (json.root != null) {
    const new_base_dir = Path.resolve(base_dir, json.root);
    assert_base(new_base_dir, dir_root);
    base_dir = new_base_dir;
  }

  const meta = metadata(J.from(json).at("metadata"), dir_root, base_dir);
  const archive = files(json.files, dir_root, base_dir);

  switch (x.type) {
    case "web-archive": {
      save(
        new Cart.Cartridge(
          json.id,
          meta,
          archive,
          new Cart.Platform.Web_archive(
            load_text_file(x.html, dir_root, base_dir),
            x.bridges.flatMap(make_bridge)
          )
        ),
        output
      );
      break;
    }

    default:
      throw new Error(`Unsupported type ${(x as any).type}`);
  }
}
