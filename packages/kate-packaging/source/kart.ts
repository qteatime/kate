import * as Path from "path";
import * as FS from "fs";
import * as Cart from "../../schema/generated/cartridge";
import { add_fingerprint } from "../../schema/lib/fingerprint";
import * as Glob from "glob";
const [out, json_file] = process.argv.slice(2);

if (!out || !json_file) {
  console.log("Usage: kart <out.kart> <json>");
  process.exit(1);
}

type Kart = {
  id: string;
  root?: string;
  metadata: {
    author: string;
    title: string;
    category: string;
    content_warning: string[];
    description: string;
    thumbnail_path: string;
  };
  files: string[];
  platform: KartPlatform;
};

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
  | { type: "rpgmk-mv" }
  | { type: "renpy" }
  | { type: "standard-network" }
  | { type: "local-storage" }
  | {
      type: "input-proxy";
      mapping: { [key: string]: KeyboardKey } | "defaults";
    };

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

let base_dir = Path.dirname(Path.resolve(json_file));
const dir_root = base_dir;
const json: Kart = JSON.parse(FS.readFileSync(json_file, "utf-8"));
const x = json.platform;
if (json.root != null) {
  const new_base_dir = Path.resolve(base_dir, json.root);
  assert_base(new_base_dir);
  base_dir = new_base_dir;
}

function assert_base(path: string) {
  const file = FS.realpathSync(path);
  if (!file.startsWith(dir_root)) {
    throw new Error(
      `Cannot load file '${file}' because it's outside of the base directory '${base_dir}'`
    );
  }
  return file;
}

function load_file(path0: string) {
  const path = Path.resolve(base_dir, path0);
  return new Uint8Array(FS.readFileSync(assert_base(path)));
}

function load_text_file(path0: string) {
  const path = Path.resolve(base_dir, path0);
  return FS.readFileSync(assert_base(path), "utf-8");
}

function metadata(x: Kart["metadata"]) {
  return new Cart.Metadata(
    x.author,
    x.title,
    x.description,
    x.category,
    x.content_warning,
    new Cart.Content_classification.General(),
    new Cart.Date(2000, 1, 1),
    new Cart.File("thumbnail.png", "image/png", load_file(x.thumbnail_path))
  );
}

function make_absolute(path: string) {
  if (path.startsWith("/")) {
    return path;
  } else {
    return `/${path}`;
  }
}

function files(patterns: Kart["files"]) {
  const paths = [
    ...new Set(patterns.flatMap((x) => Glob.sync(x, { cwd: base_dir }))),
  ];
  return paths.map((path) => {
    const ext = Path.extname(path);
    const mime = mime_table[ext] ?? "application/octet-stream";
    return new Cart.File(make_absolute(path), mime, load_file(path));
  });
}

function save(cart: Cart.Cartridge) {
  const encoder = new Cart._Encoder();
  cart.encode(encoder);
  FS.writeFileSync(out, add_fingerprint(encoder.to_bytes()));
}

function make_bridge(x: Bridge) {
  switch (x.type) {
    case "rpgmk-mv": {
      return new Cart.Bridge.RPG_maker_mv();
    }

    case "standard-network": {
      return new Cart.Bridge.Network_proxy();
    }

    case "local-storage": {
      return new Cart.Bridge.Local_storage_proxy();
    }

    case "renpy": {
      return new Cart.Bridge.Renpy();
    }

    case "input-proxy": {
      return new Cart.Bridge.Input_proxy(
        new Map(Object.entries(get_mapping(x.mapping)).map(make_key_pair))
      );
    }

    default:
      throw new Error(`Unknown bridge ${(x as any).type}`);
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
    new Cart.KeyboardKey(key, code, BigInt(key_code)),
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

const meta = metadata(json.metadata);
const archive = files(json.files);

switch (x.type) {
  case "web-archive": {
    save(
      new Cart.Cartridge(
        json.id,
        meta,
        archive,
        new Cart.Platform.Web_archive(
          load_text_file(x.html),
          x.bridges.map(make_bridge)
        )
      )
    );
    break;
  }

  default:
    throw new Error(`Unsupported type ${(x as any).type}`);
}
