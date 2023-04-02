import { Cart_v2 } from "./v2";
import { unreachable } from "../utils";
import { InputKey } from "../kernel";
import { chars_in_mb } from "./parser-utils";

export type Runtime = WebArchiveRuntime;

export type WebArchiveRuntime = {
  type: "web-archive";
  bridges: Bridge[];
  html: string;
};

export type Bridge =
  | { type: "network-proxy" }
  | { type: "local-storage-proxy" }
  | { type: "input-proxy"; mapping: Map<InputKey, Key> }
  | { type: "preserve-render" };

export type Key = {
  key: string;
  code: string;
  key_code: number;
};

export function parse_runtime(cart: Cart_v2.Cartridge): Runtime {
  const platform = cart.platform;
  switch (platform.$tag) {
    case Cart_v2.Platform.$Tags.Web_archive: {
      return {
        type: "web-archive",
        bridges: platform.bridges.map(bridge),
        html: str(platform.html, chars_in_mb(1)),
      };
    }
  }
}

function bridge(x: Cart_v2.Bridge): Bridge {
  switch (x.$tag) {
    case Cart_v2.Bridge.$Tags.Input_proxy: {
      return {
        type: "input-proxy",
        mapping: map_map(x.mapping, (a, b) => [
          virtual_key(a),
          keyboard_key(b),
        ]),
      };
    }
    case Cart_v2.Bridge.$Tags.Local_storage_proxy: {
      return { type: "local-storage-proxy" };
    }
    case Cart_v2.Bridge.$Tags.Network_proxy: {
      return { type: "network-proxy" };
    }
    case Cart_v2.Bridge.$Tags.Preserve_render: {
      return { type: "preserve-render" };
    }
    default:
      throw unreachable(x);
  }
}

function map_map<A, B, C, D>(
  map: Map<A, B>,
  f: (a: A, b: B) => [C, D]
): Map<C, D> {
  const result = new Map<C, D>();
  for (const [k, v] of map.entries()) {
    const [k1, v1] = f(k, v);
    result.set(k1, v1);
  }
  return result;
}

function virtual_key(key: Cart_v2.VirtualKey): InputKey {
  switch (key.$tag) {
    case Cart_v2.VirtualKey.$Tags.Capture:
      return "capture";
    case Cart_v2.VirtualKey.$Tags.Menu:
      return "menu";
    case Cart_v2.VirtualKey.$Tags.Up:
      return "up";
    case Cart_v2.VirtualKey.$Tags.Right:
      return "right";
    case Cart_v2.VirtualKey.$Tags.Down:
      return "down";
    case Cart_v2.VirtualKey.$Tags.Left:
      return "left";
    case Cart_v2.VirtualKey.$Tags.O:
      return "o";
    case Cart_v2.VirtualKey.$Tags.X:
      return "x";
    case Cart_v2.VirtualKey.$Tags.L_trigger:
      return "ltrigger";
    case Cart_v2.VirtualKey.$Tags.R_trigger:
      return "rtrigger";
    default:
      throw unreachable(key);
  }
}

function keyboard_key(key: Cart_v2.KeyboardKey): Key {
  return {
    code: str(key.code, 255),
    key: str(key.key, 255),
    key_code: Number(key.key_code),
  };
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
