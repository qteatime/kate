const schema_source = require("../generated/cartridge.json");
import * as LJT from "../../ljt-vm/build";
import * as Cart from "../generated/cartridge-schema";
export * from "../generated/cartridge-schema";

export function decode(bytes: Uint8Array, root: number): Cart.Cartridge {
  const schema = LJT.parse(schema_source);
  return LJT.decode(bytes, schema, root) as any;
}

export function encode(value: Cart.Cartridge): Uint8Array {
  const schema = LJT.parse(schema_source);
  return LJT.encode(value, schema, value["@tag"]);
}
