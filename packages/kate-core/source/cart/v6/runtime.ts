/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Cart_v6 } from "./v6";
import { unreachable } from "../../utils";
import { Bridge, KeyboardKey, Runtime } from "../cart-type";
import { KateButton } from "../../kernel";
const keymap = require("../../../../kate-tools/assets/keymap.json");

export function parse_runtime(metadata: Cart_v6.Metadata): Runtime {
  const platform = metadata.runtime;
  switch (platform["@variant"]) {
    case Cart_v6.Runtime.$Tags.Web_archive: {
      return {
        type: "web-archive",
        bridges: platform.bridges.map(bridge),
        html_path: str(platform["html-path"], 1_024),
      };
    }
  }
}

function bridge(x: Cart_v6.Bridge): Bridge {
  switch (x["@variant"]) {
    case Cart_v6.Bridge.$Tags.Input_proxy: {
      return bridge(
        Cart_v6.Bridge.Keyboard_input_proxy_v2({
          mapping: x.mapping,
          selector: Cart_v6.Keyboard_input_selector.Legacy({}),
        })
      );
    }
    case Cart_v6.Bridge.$Tags.Local_storage_proxy: {
      return { type: "local-storage-proxy" };
    }
    case Cart_v6.Bridge.$Tags.Network_proxy: {
      return { type: "network-proxy" };
    }
    case Cart_v6.Bridge.$Tags.Preserve_WebGL_render: {
      return { type: "preserve-render" };
    }
    case Cart_v6.Bridge.$Tags.Capture_canvas: {
      return { type: "capture-canvas", selector: str(x.selector, 255) };
    }
    case Cart_v6.Bridge.$Tags.Pointer_input_proxy: {
      return {
        type: "pointer-input-proxy",
        selector: str(x.selector, 255),
        hide_cursor: x["hide-cursor"],
      };
    }
    case Cart_v6.Bridge.$Tags.IndexedDB_proxy: {
      return { type: "indexeddb-proxy", versioned: x.versioned };
    }
    case Cart_v6.Bridge.$Tags.Renpy_web_tweaks: {
      return { type: "renpy-web-tweaks", version: x.version };
    }
    case Cart_v6.Bridge.$Tags.External_URL_handler: {
      return { type: "external-url-handler" };
    }
    case Cart_v6.Bridge.$Tags.Keyboard_input_proxy_v2: {
      return {
        type: "keyboard-input-proxy-v2",
        mapping: map_map(x.mapping, (a, b) => [virtual_key(a), keyboard_key(b)]),
        selector: keyboard_selector(x.selector),
      };
    }
    case Cart_v6.Bridge.$Tags.Network_proxy_v2: {
      return {
        type: "network-proxy-v2",
        allow_sync_access: list(
          x["allow-sync-access"].map((x) => str(x, 255)),
          255
        ),
      };
    }
    case Cart_v6.Bridge.$Tags.Resize_canvas: {
      return {
        type: "resize-canvas",
        selector: str(x.selector, 255),
      };
    }
    default:
      throw unreachable(x);
  }
}

function map_map<A, B, C, D>(map: Map<A, B>, f: (a: A, b: B) => [C, D]): Map<C, D> {
  const result = new Map<C, D>();
  for (const [k, v] of map.entries()) {
    const [k1, v1] = f(k, v);
    result.set(k1, v1);
  }
  return result;
}

function keyboard_selector(x: Cart_v6.Keyboard_input_selector): string {
  switch (x["@variant"]) {
    case Cart_v6.Keyboard_input_selector.$Tags.CSS:
      return x.selector;
    case Cart_v6.Keyboard_input_selector.$Tags.Document:
      return "document";
    case Cart_v6.Keyboard_input_selector.$Tags.Window:
      return "window";
    case Cart_v6.Keyboard_input_selector.$Tags.Legacy:
      return "legacy";
    default:
      throw unreachable(x);
  }
}

function virtual_key(key: Cart_v6.Virtual_key): KateButton {
  switch (key["@variant"]) {
    case Cart_v6.Virtual_key.$Tags.Capture:
      return "capture";
    case Cart_v6.Virtual_key.$Tags.Menu:
      return "menu";
    case Cart_v6.Virtual_key.$Tags.Up:
      return "up";
    case Cart_v6.Virtual_key.$Tags.Right:
      return "right";
    case Cart_v6.Virtual_key.$Tags.Down:
      return "down";
    case Cart_v6.Virtual_key.$Tags.Left:
      return "left";
    case Cart_v6.Virtual_key.$Tags.O:
      return "o";
    case Cart_v6.Virtual_key.$Tags.X:
      return "x";
    case Cart_v6.Virtual_key.$Tags.L_trigger:
      return "ltrigger";
    case Cart_v6.Virtual_key.$Tags.R_trigger:
      return "rtrigger";
    case Cart_v6.Virtual_key.$Tags.Berry:
      return "berry";
    case Cart_v6.Virtual_key.$Tags.Sparkle:
      return "sparkle";
    default:
      throw unreachable(key);
  }
}

function keyboard_key(key: Cart_v6.Keyboard_key): KeyboardKey {
  const mapping = keymap[key.code];
  if (mapping == null) {
    throw new Error(`Invalid keycode ${key}`);
  }
  return mapping;
}

function str(x: unknown, size: number = Infinity): string {
  if (typeof x !== "string") {
    throw new Error(`Expected string`);
  }
  if (x.length > size) {
    throw new Error(`String is too long (maximum: ${size})`);
  }
  return x;
}

function list<A>(xs: A[], size: number) {
  if (xs.length > size) {
    throw new Error(`List is too long (maximum: ${size})`);
  }
  return xs;
}
