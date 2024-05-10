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

import * as Path from "path";
import * as FS from "fs";
import * as Glob from "glob";

const www_root = Path.join(__dirname, "../packaging/web");
const asset_root = Path.join(__dirname, "../assets");

const ignored_files = new Set(["index.html", "manifest.json", "worker.js", "test.html"]);

function copy(root: string, from: string, out: string) {
  console.log("-> Copying", from);
  FS.mkdirSync(Path.dirname(Path.join(out, from)), { recursive: true });
  FS.copyFileSync(Path.join(root, from), Path.join(out, from));
}

function copy_template(
  root: string,
  from: string,
  out: string,
  template: { [key: string]: string }
) {
  console.log("-> Copying template", from);
  FS.mkdirSync(Path.dirname(Path.join(out, from)), { recursive: true });
  const contents0 = FS.readFileSync(Path.join(root, from), "utf-8");
  const contents1 = contents0.replace(/{{([\w_]+)}}/g, (_, id) => {
    if (!(id in template)) {
      throw new Error(`Missing value for template variable: ${id}`);
    }
    return template[id];
  });
  FS.writeFileSync(Path.join(out, from), contents1);
}

export async function generate(
  cart: string,
  out: string,
  kind: string,
  overwrite: boolean,
  config: {
    case_mode: {
      type: "handheld" | "tv" | "fullscreen";
      resolution: 480 | 720 | 960;
      scale_to_fit: boolean;
    };
  }
) {
  switch (kind) {
    case "web": {
      const files = Glob.sync("**/*", { cwd: www_root, nodir: true });
      if (FS.existsSync(out) && !overwrite) {
        console.log("Output directory already exists. Aborting");
        return;
      }
      FS.mkdirSync(out, { recursive: true });
      for (const file of files) {
        if (ignored_files.has(file)) {
          continue;
        }
        copy(www_root, file, out);
      }
      copy_template(asset_root, "index.html", out, {
        config: JSON.stringify(config),
        case_type: config.case_mode.type,
      });
      console.log(`-> Copying cartridge (${cart})`);
      FS.copyFileSync(cart, Path.join(out, "game.kart"));
      break;
    }

    default: {
      throw new Error(`Unsupported packaging type: ${kind}`);
    }
  }
}
