/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { JSZip } from "../deps/jszip";
import { kart_v6 as Cart } from "../deps/schema";
import { GlobPattern, GlobPatternList, Pathname, gb, make_id, map_async } from "../deps/utils";
import { rpa } from "../formats";
import type { CartConfig, Importer } from "./core";
import {
  make_file,
  make_game_id,
  make_mapping,
  make_meta,
  maybe_add_thumbnail,
  mime_type,
} from "./make-cart";

export class RenpyImporter implements Importer {
  static async accepts(files0: KateTypes.DeviceFileHandle[]) {
    const is_renpy_main = GlobPattern.from_pattern("renpy/__init__.py");
    const is_packaged_main = GlobPattern.from_pattern("*/renpy/__init__.py");
    const [main] = files0.filter(
      (x) => is_renpy_main.test(x.relative_path) || is_packaged_main.test(x.relative_path)
    );
    if (main != null) {
      const files1 = maybe_unpackage(main, files0);
      const files = await maybe_unarchive(files1);
      const version = await get_renpy_version(files);
      if (version == null) {
        console.error(`Unsupported Ren'Py version`);
        return [];
      }
      const title = await get_renpy_title(files);
      return [new RenpyImporter(files, make_id(), title, version)];
    } else {
      return [];
    }
  }

  public thumbnail: Uint8Array | null = null;

  constructor(
    readonly files: KateTypes.DeviceFileHandle[],
    readonly id: string,
    readonly title: string,
    readonly versions: { game: string; engine: string }
  ) {}

  get engine() {
    return `Renpy v${this.versions.engine} (originally ${this.versions.game})`;
  }

  get engine_major() {
    return Number(this.versions.engine.split(".")[0]);
  }

  get engine_minor() {
    return Number(this.versions.engine.split(".")[1]);
  }

  async make_cartridge(): Promise<CartConfig> {
    const now = new Date();
    const decoder = new TextDecoder();
    const runtime_dir = Pathname.from_string("/www/runtimes/renpy").to(this.versions.engine);

    const runtime_files: string[] = JSON.parse(
      decoder.decode(
        (
          await KateAPI.cart_fs.read_file(
            runtime_dir.to(".kate.files.json").make_absolute().as_string()
          )
        ).bytes
      )
    );

    const { zip, remote } = await make_game_zip(runtime_dir, this.files);

    const files0 = [
      ...(await map_async(runtime_files, async (x) => {
        return make_file(Pathname.from_string(x), async () => {
          return (await KateAPI.cart_fs.read_file(runtime_dir.to(x).as_string())).bytes;
        });
      })),
      await zip,
      ...(await map_async(remote, async (x) => {
        return make_file(x.relative_path, () => x.read());
      })),
    ];
    const files = await maybe_add_thumbnail(files0, this.thumbnail);

    const cartridge: CartConfig = {
      metadata: Cart.Metadata({
        ...make_meta(this.title, this.thumbnail),
        identification: Cart.Meta_identification({
          id: make_game_id(this.id, this.title),
          version: Cart.Version({ major: 1, minor: 0 }),
          "release-date": Cart.Date({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
          }),
        }),
        security: Cart.Security({
          capabilities: [],
        }),
        runtime: Cart.Runtime.Web_archive({
          "html-path": "/index.html",
          bridges: [
            Cart.Bridge.Network_proxy({}),
            Cart.Bridge.Keyboard_input_proxy_v2({
              mapping: make_mapping({
                up: "ArrowUp",
                right: "ArrowRight",
                left: "ArrowLeft",
                down: "ArrowDown",
                x: "Escape",
                o: "Enter",
                sparkle: "KeyH",
                berry: null,
                menu: "ShiftLeft",
                capture: null,
                ltrigger: "PageUp",
                rtrigger: "ControlLeft",
              }),
              selector: Cart.Keyboard_input_selector.Window({}),
            }),
            Cart.Bridge.Pointer_input_proxy({
              selector: "#canvas",
              "hide-cursor": false,
            }),
            Cart.Bridge.Preserve_WebGL_render({}),
            Cart.Bridge.Capture_canvas({ selector: "#canvas" }),
            Cart.Bridge.IndexedDB_proxy({ versioned: false }),
            Cart.Bridge.Renpy_web_tweaks({
              version: Cart.Version({
                major: this.engine_major,
                minor: this.engine_minor,
              }),
            }),
          ],
        }),
        files: files.map((x) => x.meta),
        signature: [],
      }),
      files: files.map((x) => x.data),
    };
    return cartridge;
  }
}

async function get_renpy_title(files: KateTypes.DeviceFileHandle[]) {
  const decoder = new TextDecoder();

  // If we can get the name from the source code that's best, as it'll likely
  // be the most accurate we can get.
  const is_rpy_file = GlobPatternList.from_patterns(["game/options.rpy"]);
  const rpy_files = files.filter((x) => is_rpy_file.test(x.relative_path));
  for (const file of rpy_files) {
    const content = decoder.decode(await file.read());
    const title_re = /\bconfig\.name\s*=\s*_?\(?\s*"([^"]+)"/;
    const match = content.match(title_re);
    if (match != null) {
      return match[1];
    }
  }

  // Otherwise we fall back to inferring it from an executable file.
  const is_executable = GlobPatternList.from_patterns(["*.exe", "*.sh"]);
  const executable = files.find((x) => is_executable.test(x.relative_path));
  if (executable != null) {
    return executable.relative_path.basename() || "(Untitled)";
  }

  // If all fails, leave it up to the user to amend a title.
  return "(Untitled)";
}

async function get_renpy_version(files: KateTypes.DeviceFileHandle[]) {
  const is_version = GlobPattern.from_pattern("game/script_version.txt");
  const rpy_version_handle = files.find((x) => is_version.test(x.relative_path));
  if (rpy_version_handle == null) {
    return null;
  }

  const decoder = new TextDecoder();
  const rpy_version = decoder.decode(await rpy_version_handle.read());
  const [_, major, minor] = rpy_version.match(/\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)!;
  switch (major) {
    case "6":
    case "7":
      return { engine: "7.5", game: `${major}.${minor}` };
    case "8":
      return { engine: "8.1", game: `${major}.${minor}` };
    default:
      console.log(`Unsupported version: ${major}.${minor}`);
      return null;
  }
}

async function make_game_zip(runtime_dir: Pathname, files0: KateTypes.DeviceFileHandle[]) {
  const encoder = new TextEncoder();
  const is_game = GlobPattern.from_pattern("game/**");
  const is_remote = is_image.join(is_audio).join(is_video);
  const files = files0.filter(
    (x) => is_game.test(x.relative_path) && !is_remote.test(x.relative_path)
  );
  const zip = await JSZip.loadAsync(
    (
      await KateAPI.cart_fs.read_file(runtime_dir.to("renpy.zip").make_relative().as_string())
    ).bytes
  );
  for (const file of files) {
    zip.file(file.relative_path.make_relative().as_string(), await file.read());
  }
  const game_files = await get_remote_files(files0);
  zip.file("game/renpyweb_remote_files.txt", encoder.encode(game_files.remote_rules));
  for (const file of game_files.placeholders) {
    zip.file(Pathname.from_string(file.meta.path).make_relative().as_string(), await file.data());
  }
  for (const file of game_files.zipped) {
    zip.file(file.relative_path.make_relative().as_string(), await file.read());
  }
  const bucket = await KateAPI.file_store.make_temporary(gb(8));
  const zip_file = await bucket.create_file(
    "game.zip",
    await zip.generateAsync({ type: "uint8array" })
  );
  return {
    remote: game_files.remotes,
    zip: make_file(Pathname.from_string("/game.zip"), zip_file.read_slice.bind(zip_file, 0)),
  };
}

const is_image = GlobPatternList.from_patterns([
  "game/**/*.jpg",
  "game/**/*.jpeg",
  "game/**/*.png",
  "game/**/*.webp",
  "game/*.jpg",
  "game/*.jpeg",
  "game/*.png",
  "game/*.webp",
]);

const is_audio = GlobPatternList.from_patterns([
  "game/**/*.wav",
  "game/**/*.mp2",
  "game/**/*.mp3",
  "game/**/*.ogg",
  "game/**/*.opus",
  "game/*.wav",
  "game/*.mp2",
  "game/*.mp3",
  "game/*.ogg",
  "game/*.opus",
]);

const is_video = GlobPatternList.from_patterns([
  "game/**/*.ogv",
  "game/**/*.webm",
  "game/**/*.mp4",
  "game/**/*.mkv",
  "game/**/*.avi",
  "game/*.ogv",
  "game/*.webm",
  "game/*.mp4",
  "game/*.mkv",
  "game/*.avi",
]);

function get_remote_type(path: Pathname): RemoteType | null {
  if (is_image.test(path)) {
    return "image";
  } else if (is_audio.test(path)) {
    return "music";
  } else if (is_video.test(path)) {
    return "video";
  } else {
    return null;
  }
}

async function get_remote_files(files: KateTypes.DeviceFileHandle[]) {
  const is_game = GlobPattern.from_pattern("game/**");
  const filter = await get_remote_filter(files);
  const remotes: {
    type: RemoteType;
    rule: string;
    file: KateTypes.DeviceFileHandle;
  }[] = [];
  const zipped: KateTypes.DeviceFileHandle[] = [];

  function classify(file: KateTypes.DeviceFileHandle, type: RemoteType, remote: boolean) {
    if (remote) {
      const suffix = type === "image" ? "1,1" : "-";
      remotes.push({
        type,
        rule: `${file.relative_path
          .drop_prefix(["game"])
          .make_relative()
          .as_string()}\n${type} ${suffix}`,
        file,
      });
    } else {
      zipped.push(file);
    }
  }

  for (const file of files) {
    if (!is_game.test(file.relative_path)) {
      continue;
    }

    const type = get_remote_type(file.relative_path);
    switch (type) {
      case "image": {
        classify(file, "image", filter.is_remote("image", file.relative_path) ?? false);
        break;
      }

      case "music":
      case "voice": {
        const type =
          filter.is_remote("music", file.relative_path) != null
            ? "music"
            : filter.is_remote("voice", file.relative_path) != null
            ? "voice"
            : "music";
        classify(file, type, filter.is_remote(type, file.relative_path) ?? false);
        break;
      }

      case "video": {
        classify(file, "video", true);
        break;
      }

      default:
        zipped.push(file);
        break;
    }
  }

  const placeholder_img = new Uint8Array(await (await make_placeholder()).arrayBuffer());
  const placeholders = await Promise.all(
    remotes
      .filter((x) => x.type === "image")
      .map((x) =>
        make_file(
          Pathname.from_string("_placeholders").join(x.file.relative_path.drop_prefix(["game"])),
          async () => placeholder_img
        )
      )
  );

  return {
    remote_rules: remotes.map((x) => x.rule).join("\n") + "\n",
    remotes: remotes.map((x) => x.file),
    zipped,
    placeholders,
  };
}

type RemoteType = "image" | "music" | "voice" | "video";
type RemoteFilterRule = {
  pattern: GlobPattern | GlobPatternList;
  type: RemoteType;
  remote: boolean;
};

class RemoteFilter {
  constructor(readonly rules: RemoteFilterRule[]) {}

  is_remote(type: RemoteType, path: Pathname): boolean | null {
    const rules = this.rules.filter((x) => x.type === type);
    for (const rule of rules) {
      if (rule.pattern.test(path)) {
        return rule.remote;
      }
    }
    return null;
  }
}

async function get_remote_filter(files: KateTypes.DeviceFileHandle[]): Promise<RemoteFilter> {
  const is_progressive_rules = GlobPattern.from_pattern("progressive_download.txt");
  const rules = files.find((x) => is_progressive_rules.test(x.relative_path));
  if (rules != null) {
    const decoder = new TextDecoder();
    return parse_progressive_filter(decoder.decode(await rules.read()));
  } else {
    return new RemoteFilter([
      {
        pattern: GlobPattern.from_pattern("game/music/**"),
        type: "music",
        remote: true,
      },
      {
        pattern: GlobPattern.from_pattern("game/voice/**"),
        type: "voice",
        remote: true,
      },
    ]);
  }
}

function parse_progressive_filter(program: string) {
  const lines = program.split(/\r\n|\r|\n/).filter((x) => !/^\s*#/.test(x));
  const rule_re = /^\s*(\-|\+)\s+(image|music|voice|video)\s+(.+)\s*$/;
  const rules: RemoteFilterRule[] = lines.flatMap((x) => {
    const match = x.match(rule_re);
    if (match == null) {
      return [];
    } else {
      const [_, remote, type, pattern] = match;
      return {
        pattern: GlobPattern.from_pattern(pattern.trim()),
        type: type as RemoteType,
        remote: remote === "+",
      };
    }
  });
  return new RemoteFilter(rules);
}

function make_placeholder() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  return new Promise<Blob>((resolve, reject) => {
    const url = canvas.toBlob((blob) => {
      if (blob == null) {
        reject(new Error("Invalid image"));
      } else {
        resolve(blob);
      }
    }, "image/png");
  });
}

function maybe_unpackage(main: KateTypes.DeviceFileHandle, files: KateTypes.DeviceFileHandle[]) {
  if (main.relative_path.starts_with(Pathname.from_string("renpy")) || !(main as any).__fake) {
    return files;
  } else {
    for (const file of files) {
      (file as any).relative_path = file.relative_path.drop_prefix([
        file.relative_path.segments[0],
      ]);
    }
    return files;
  }
}

async function maybe_unarchive(files: KateTypes.DeviceFileHandle[]) {
  const is_archive = GlobPatternList.from_patterns(["**/*.rpa", "*.rpa"]);
  const without_archive = files.filter((x) => !is_archive.test(x.relative_path));
  const archive_files = files.filter((x) => is_archive.test(x.relative_path));
  const unpacked_files = (
    await Promise.all(
      archive_files.map(async (x) => {
        return rpa.unpack_archive(x.relative_path, await x.read());
      })
    )
  ).flat();
  return without_archive.concat(unpacked_files);
}
