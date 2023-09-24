/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as LJT from "../../ljt-vm/build";
const source = require("./generated/kart-v4.json");
import * as Cart from "./generated/kart-v4";
export * from "./generated/kart-v4";

const schema = LJT.parse(source);

export function decode(bytes: Uint8Array): Cart.Cartridge {
  return LJT.decode(bytes, schema, Cart.Cartridge.tag) as any;
}

export function encode(value: Cart.Cartridge): Uint8Array {
  return LJT.encode(value, schema, Cart.Cartridge.tag);
}
