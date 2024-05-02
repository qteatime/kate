/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { kart_v6 as Cart } from "../deps/schema";
import { GlobPattern, Pathname, make_id, unreachable } from "../deps/utils";
import type { CartConfig, Importer } from "./core";
import {
  make_file,
  make_game_id,
  make_mapping,
  make_meta,
  maybe_add_thumbnail,
  mime_type,
} from "./make-cart";

export class BitsyImporter implements Importer {
  static async accepts(files: KateTypes.DeviceFileHandle[]) {
    const is_html = GlobPattern.from_pattern("*.html");
    const matches = files.filter((x) => is_html.test(x.relative_path));
    const candidates = (await Promise.all(matches.map(try_bitsy_page))).flat();
    return candidates.map((x) => new BitsyImporter(files, make_id(), x.title, x.version, x.file));
  }

  public thumbnail: Uint8Array | null = null;

  constructor(
    readonly files: KateTypes.DeviceFileHandle[],
    readonly id: string,
    readonly title: string,
    readonly version: string | null,
    readonly entry: KateTypes.DeviceFileHandle
  ) {}

  get engine() {
    return `Bitsy v${this.version ?? "(unknown)"}`;
  }

  async make_cartridge(): Promise<CartConfig> {
    const now = new Date();

    const files0 = await Promise.all(
      this.files.map(async (x) => {
        return make_file(x.relative_path, () => x.read());
      })
    );
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
          "html-path": this.entry.relative_path.as_string(),
          bridges: [
            Cart.Bridge.Keyboard_input_proxy_v2({
              selector: Cart.Keyboard_input_selector.Document({}),
              mapping: make_mapping({
                up: "ArrowUp",
                right: "ArrowRight",
                left: "ArrowLeft",
                down: "ArrowDown",
                x: "KeyX",
                o: "KeyZ",
                sparkle: null,
                menu: null,
                capture: null,
                berry: null,
                ltrigger: null,
                rtrigger: null,
              }),
            }),
            Cart.Bridge.Capture_canvas({ selector: "#game" }),
            Cart.Bridge.Resize_canvas({ selector: "#game" }),
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
