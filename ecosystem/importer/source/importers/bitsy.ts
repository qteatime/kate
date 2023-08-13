import { Cart } from "../deps/schema";
import { GlobPattern, Pathname, make_id, unreachable } from "../deps/utils";

export class BitsyImporter {
  static async accepts(files: KateTypes.DeviceFileHandle[]) {
    const is_html = GlobPattern.from_pattern("*.html");
    const matches = files.filter((x) => is_html.test(x.relative_path));
    const candidates = (await Promise.all(matches.map(try_bitsy_page))).flat();
    return candidates.map(
      (x) => new BitsyImporter(files, x.title, x.version, x.file)
    );
  }

  constructor(
    readonly files: KateTypes.DeviceFileHandle[],
    readonly title: string,
    readonly version: string | null,
    readonly entry: KateTypes.DeviceFileHandle
  ) {}

  async make_cartridge() {
    const id = make_id();
    const now = new Date();

    const files = await Promise.all(
      this.files.map(async (x) => {
        const data = await x.read();
        const integrity = await crypto.subtle.digest("SHA-256", data.buffer);
        return Cart.File({
          path: x.relative_path.as_string(),
          mime: mime_type(x.relative_path),
          integrity: new Uint8Array(integrity),
          data: data,
        });
      })
    );

    const cartridge = Cart.Cartridge({
      id: `imported.kate.local/${id}`,
      version: Cart.Version({ major: 1, minor: 0 }),
      "release-date": Cart.Date({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      }),
      security: Cart.Security({
        capabilities: [],
      }),
      runtime: Cart.Runtime.Web_archive({
        "html-path": this.entry.relative_path.as_string(),
        bridges: [
          Cart.Bridge.Input_proxy({
            mapping: make_mapping({
              up: "ArrowUp",
              right: "ArrowRight",
              left: "ArrowLeft",
              down: "ArrowDown",
              x: "KeyX",
              o: "KeyZ",
              menu: "ShiftLeft",
              capture: "KeyC",
              ltrigger: "KeyA",
              rtrigger: "KeyS",
            }),
          }),
          Cart.Bridge.Capture_canvas({ selector: "#game" }),
        ],
      }),
      metadata: make_meta(this.title),
      files: files,
    });
    return cartridge;
  }
}

async function try_bitsy_page(file: KateTypes.DeviceFileHandle) {
  const decoder = new TextDecoder();
  const html = decoder.decode(await file.read());
  const dom = new DOMParser().parseFromString(html, "text/html");
  const bitsy_scripts = dom.querySelectorAll(
    `script[type="text/bitsyGameData"], script[type="text/bitsyFontData"], script[type="bitsyGameData"]`
  );
  const version_match = html.match(/# BITSY VERSION (\d+(?:\.\d+)?)/);
  const version = version_match != null ? version_match[1] : null;
  const title = dom.querySelector("title")?.textContent ?? "Untitled";
  if (bitsy_scripts.length > 0 || version != null) {
    return [{ title, file, version }];
  } else {
    return [];
  }
}

function make_mapping(mapping: Record<KateTypes.InputKey, string>) {
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

function mime_type(path: Pathname) {
  return mime_table[path.extname() ?? ""] ?? "application/octet-stream";
}

function make_meta(title: string) {
  return [
    Cart.Metadata.Presentation({
      title: title,
      author: "Unknown",
      tagline: "",
      description: "",
      "release-type": Cart.Release_type.Unofficial({}),
      "thumbnail-path": null,
      "banner-path": null,
    }),
    Cart.Metadata.Classification({
      genre: [],
      tags: [],
      rating: Cart.Content_rating.Unknown({}),
      warnings: null,
    }),
    Cart.Metadata.Legal({
      "derivative-policy": Cart.Derivative_policy.Not_allowed({}),
      "licence-path": null,
      "privacy-policy-path": null,
    }),
    Cart.Metadata.Accessibility({
      "input-methods": [],
      languages: [],
      provisions: [],
      "average-session-seconds": null,
      "average-completion-seconds": null,
    }),
  ];
}
