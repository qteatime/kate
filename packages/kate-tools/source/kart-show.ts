/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Shows the contents of a Kate cartridge.

import { FileHandle } from "fs/promises";
import { kart_v6 as Cart, decode_header, decode_metadata } from "./deps/schema";
import {
  byte_equals,
  bytes_to_hex,
  fine_grained_time_seconds,
  from_bytes,
  unreachable,
} from "./deps/util";
import * as crypto from "crypto";

export async function show(file: FileHandle) {
  const header = await decode_header(file);
  const meta = await decode_metadata(file, header);

  console.log(`** requires Kate version: ${version(header["minimum-kate-version"])}\n`);
  show_identification(meta.identification);
  console.log("-".repeat(72));
  show_presentation(meta.presentation);
  show_classification(meta.classification);
  show_legal(meta.legal);
  show_accessibility(meta.accessibility);
  console.log("-".repeat(72));
  show_security(meta.security);
  console.log("-".repeat(72));
  show_runtime(meta.runtime);
  console.log("-".repeat(72));
  await show_files(file, meta.files);
  console.log("-".repeat(72));
  console.log("Signatures:\n");
  meta.signature.forEach(show_signature);
}

function version(x: Cart.Kate_version) {
  return `v${x.major}.${x.minor}.${x.patch}`;
}

function cart_version(x: Cart.Version) {
  return `v${x.major}.${x.minor}`;
}

function date(x: Cart.Date) {
  return new Date(x.year, x.month - 1, x.day).toDateString();
}

function show_identification(x: Cart.Meta_identification) {
  console.log(`${x.id} @ ${cart_version(x.version)}`);
  console.log(`Released: ${date(x["release-date"])}`);
}

function show_presentation(x: Cart.Meta_presentation) {
  console.log(`Presentation:\n`);
  console.log(`  Title: ${x.title}`);
  console.log(`  Author: ${x.author}`);
  console.log(`  Tagline: ${x.tagline}`);
  console.log(`  Description:`);
  console.log(`    ${x.description}`);
  console.log(`  Release type: ${release_type(x["release-type"])}`);
  console.log(`  Thumbnail path: ${x["thumbnail-path"] ?? "(None provided)"}`);
  console.log(`  Banner path: ${x["banner-path"] ?? "(None provided)"}`);
  console.log("\n");
}

function show_classification(x: Cart.Meta_classification) {
  console.log(`Classification:\n`);
  console.log(`  Genres: ${x.genre.map(genre).join(", ")}`);
  console.log(`  Tags: ${x.tags.join(", ")}`);
  console.log(`  Rating: ${rating(x.rating)}`);
  console.log(`  Warnings:`);
  console.log(`    ${x.warnings ?? "(The author did not include warnings)"}`);
  console.log("\n");
}

function show_legal(x: Cart.Meta_legal) {
  console.log(`Legal:\n`);
  console.log(`  Derivative policy: ${derivative_policy(x["derivative-policy"])}`);
  console.log(`  Licence path: ${x["licence-path"] ?? "(None provided)"}`);
  console.log(`  Privacy policy path: ${x["privacy-policy-path"] ?? "(None provided)"}`);
  console.log("\n");
}

function show_accessibility(x: Cart.Meta_accessibility) {
  console.log(`Accessibility:\n`);
  console.log(`  Input methods: ${x["input-methods"].map(input_method)}`);
  console.log(`  Languages:`);
  console.log(`    * ${x.languages.map(language).join("\n    * ")}`);
  console.log(`  Average completion: ${time(x["average-completion-seconds"])}`);
  console.log(`  Average session: ${time(x["average-session-seconds"])}`);
  console.log("\n");
}

function show_security(x: Cart.Security) {
  console.log("Security:\n");
  x.capabilities.forEach(show_capability);
}

function show_runtime(x: Cart.Runtime) {
  const t = Cart.Runtime;
  switch (x["@variant"]) {
    case t.$Tags.Web_archive: {
      console.log(`Runtime: Web archive\n`);
      console.log(`  HTML entry-point path: ${x["html-path"]}`);
      console.log(`  `);
      console.log(`  Bridges:`);
      console.log(`    * ${x.bridges.map((x) => pad(6, bridge(x))).join("    \n\n    * ")}`);
      break;
    }
  }
}

async function show_files(handle: FileHandle, x: Cart.Meta_file[]) {
  console.log(`Files:\n`);
  let corrupted = [];
  for (const file of x) {
    const buffer = new Uint8Array(file.size);
    await handle.read({ buffer, position: Number(file.offset), length: file.size });
    const algo = hash_algo(file["hash-algorithm"]);
    const integrity = new Uint8Array(await crypto.subtle.digest(algo, buffer));
    const valid = byte_equals(integrity, file.integrity);
    if (!valid) {
      corrupted.push(file.path);
    }
    console.log(`:: ${file.path} (${from_bytes(file.size)} ${valid ? "✔️" : "❌"})`);
  }
  console.log("");
  if (corrupted.length !== 0) {
    console.log(`${corrupted.length} file(s) in the archive are corrupted:`);
    console.log(`  * ${corrupted.join("\n  * ")}`);
  }
}

function show_signature(x: Cart.Signature) {
  console.log(`  * ${x["signed-by"]} (${x["key-id"]})`);
  console.log(`    > ${bytes_to_hex(x.signature)}\n`);
}

function hash_algo(x: Cart.Hash_algorithm) {
  const t = Cart.Hash_algorithm;
  switch (x["@variant"]) {
    case t.$Tags.Sha_512:
      return "SHA-512" as const;
  }
}

function pad(n: number, x: string) {
  const prefix = " ".repeat(n);
  const [line, ...lines] = x.split(/\r\n|\r|\n/g);
  return [line, ...lines.map((x) => `${prefix}${x}`)].join("\n");
}

function bridge(x: Cart.Bridge) {
  const t = Cart.Bridge;
  switch (x["@variant"]) {
    case t.$Tags.Capture_canvas:
      return `capture-canvas {
  CSS selector: ${JSON.stringify(x.selector)}
}`;

    case t.$Tags.External_URL_handler:
      return `external-URL-handler`;

    case t.$Tags.IndexedDB_proxy:
      return `indexedDB-proxy ${x.versioned ? "(versioned)" : ""}`;

    case t.$Tags.Input_proxy:
      return `(deprecated) input-proxy {
  Mapping:
    ${pad(4, input_mapping(x.mapping))}
}`;

    case t.$Tags.Keyboard_input_proxy_v2:
      return `keyboard-input-proxy-v2 {
  CSS selector: ${keyboard_selector(x.selector)}
  Mapping:
    ${pad(4, input_mapping(x.mapping))}
}`;

    case t.$Tags.Local_storage_proxy: {
      return `local-storage-proxy`;
    }

    case t.$Tags.Network_proxy: {
      return `network-proxy`;
    }

    case t.$Tags.Network_proxy_v2: {
      return `network-proxy-v2 {
  allow_sync_access: ${JSON.stringify(x["allow-sync-access"])}
}`;
    }

    case t.$Tags.Pointer_input_proxy: {
      return `pointer-input-proxy {
  CSS selector: ${JSON.stringify(x.selector)}
  Hide cursor: ${x["hide-cursor"]}
}`;
    }

    case t.$Tags.Preserve_WebGL_render: {
      return `preserve-WebGL-render`;
    }

    case t.$Tags.Renpy_web_tweaks: {
      return `renpy-web-tweaks {version: ${cart_version(x.version)}}`;
    }

    default:
      throw unreachable(x);
  }
}

function keyboard_selector(x: Cart.Keyboard_input_selector) {
  const t = Cart.Keyboard_input_selector;
  switch (x["@variant"]) {
    case t.$Tags.CSS:
      return JSON.stringify(x.selector);
    case t.$Tags.Document:
      return "Document";
    case t.$Tags.Legacy:
      return "Document or Window";
    case t.$Tags.Window:
      return "Window";
    default:
      throw unreachable(x);
  }
}

function input_mapping(x: Map<Cart.Virtual_key, Cart.Keyboard_key>) {
  return [...x.entries()].map(([k, v]) => `* ${virtual_key(k)}: ${v.code}`).join("\n");
}

function virtual_key(x: Cart.Virtual_key) {
  const t = Cart.Virtual_key;
  switch (x["@variant"]) {
    case t.$Tags.Berry:
      return "Berry";
    case t.$Tags.Capture:
      return "Capture";
    case t.$Tags.Down:
      return "D-pad down";
    case t.$Tags.L_trigger:
      return "L bumper";
    case t.$Tags.Left:
      return "D-pad left";
    case t.$Tags.Menu:
      return "Menu";
    case t.$Tags.O:
      return "O";
    case t.$Tags.R_trigger:
      return "R bumper";
    case t.$Tags.Right:
      return "D-pad right";
    case t.$Tags.Sparkle:
      return "Sparkle";
    case t.$Tags.Up:
      return "D-pad up";
    case t.$Tags.X:
      return "X";
    default:
      throw unreachable(x);
  }
}

function show_capability(x: Cart.Capability) {
  const t = Cart.Capability;
  switch (x["@variant"]) {
    case t.$Tags.Contextual: {
      show_contextual_capability(x.capability);
      console.log(`    > Reason: ${x.reason}\n`);
      break;
    }

    case t.$Tags.Passive: {
      show_passive_capability(x.capability, x.optional);
      console.log(`    > Reason: ${x.reason}\n`);
      break;
    }

    default:
      throw unreachable(x);
  }
}

function show_contextual_capability(x: Cart.Contextual_capability) {
  const t = Cart.Contextual_capability;
  switch (x["@variant"]) {
    case t.$Tags.Download_files: {
      console.log(`  * Request to download files (contextual)`);
      break;
    }

    case t.$Tags.Install_cartridges: {
      console.log(`  * Request to install cartridges (contextual)`);
      break;
    }

    case t.$Tags.Open_URLs: {
      console.log(`  * Request to open URLs (contextual)`);
      break;
    }

    case t.$Tags.Request_device_files: {
      console.log(`  * Request access to device files (contextual)`);
      break;
    }

    case t.$Tags.Show_dialogs: {
      console.log(`  * Show dialogs`);
      break;
    }

    default:
      throw unreachable(x);
  }
}

function show_passive_capability(x: Cart.Passive_capability, optional: boolean) {
  const t = Cart.Passive_capability;
  switch (x["@variant"]) {
    case t.$Tags.Store_temporary_files: {
      console.log(`  * Store temporary files (max ${from_bytes(x["max-size-mb"] * 1024 * 1024)})`);
      break;
    }

    // default:
    //   throw unreachable(x);
  }
}

function input_method(x: Cart.Input_method) {
  const t = Cart.Input_method;
  switch (x["@variant"]) {
    case t.$Tags.Buttons:
      return "Kate gamepad";
    case t.$Tags.Pointer:
      return "Mouse/Stylus";
    default:
      throw unreachable(x);
  }
}

function language(x: Cart.Language) {
  const features = [x.interface && "interface", x.audio && "audio", x.text && "text"].filter(
    (x) => x !== false
  );
  return `${x["iso-code"]} (${features.join(", ")})`;
}

function time(x: number | null) {
  if (x == null) {
    return "(Not provided)";
  } else {
    return fine_grained_time_seconds(x);
  }
}

function derivative_policy(x: Cart.Derivative_policy) {
  const t = Cart.Derivative_policy;
  switch (x["@variant"]) {
    case t.$Tags.Commercial_use:
      return "Commercial use allowed";
    case t.$Tags.Non_commercial_use:
      return "Non-commercial use allowed";
    case t.$Tags.Not_allowed:
      return "No derivative works allowed";
    case t.$Tags.Personal_use:
      return "Allowed strictly for personal use (no sharing)";
    default:
      throw unreachable(x);
  }
}

function rating(x: Cart.Content_rating) {
  const t = Cart.Content_rating;
  switch (x["@variant"]) {
    case t.$Tags.Explicit:
      return "Explicit";
    case t.$Tags.General:
      return "General";
    case t.$Tags.Mature:
      return "Mature";
    case t.$Tags.Teen_and_up:
      return "Teen and up";
    case t.$Tags.Unknown:
      return "Unknown (treated as Explicit)";
    default:
      throw unreachable(x);
  }
}

function genre(x: Cart.Genre) {
  const t = Cart.Genre;
  switch (x["@variant"]) {
    case t.$Tags.Action:
      return "Action";
    case t.$Tags.Adventure:
      return "Adventure";
    case t.$Tags.Fighting:
      return "Fighting";
    case t.$Tags.Interactive_fiction:
      return "Interactive fiction";
    case t.$Tags.Not_specified:
      return "Not specified";
    case t.$Tags.Other:
      return "Other";
    case t.$Tags.Platformer:
      return "Platformer";
    case t.$Tags.Puzzle:
      return "Puzzle";
    case t.$Tags.RPG:
      return "RPG";
    case t.$Tags.Racing:
      return "Racing";
    case t.$Tags.Rhythm:
      return "Rhythm";
    case t.$Tags.Shooter:
      return "Shooter";
    case t.$Tags.Simulation:
      return "Simulation";
    case t.$Tags.Sports:
      return "Sports";
    case t.$Tags.Strategy:
      return "Strategy";
    case t.$Tags.Tool:
      return "Tool";
    case t.$Tags.Visual_novel:
      return "Visual novel";
    default:
      throw unreachable(x);
  }
}

function release_type(x: Cart.Release_type) {
  const t = Cart.Release_type;
  switch (x["@variant"]) {
    case t.$Tags.Beta:
      return "Beta";
    case t.$Tags.Demo:
      return "Demo";
    case t.$Tags.Early_access:
      return "Early access";
    case t.$Tags.Prototype:
      return "Prototype";
    case t.$Tags.Regular:
      return "Regular";
    case t.$Tags.Unofficial:
      return "Unofficial";
    default:
      throw unreachable(x);
  }
}
