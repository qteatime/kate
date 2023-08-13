import { Cart } from "../deps/schema";
import { BitsyImporter } from "./bitsy";

export interface Parser {
  accepts(files: KateTypes.DeviceFileHandle[]): Promise<Importer[]>;
}

export interface Importer {
  title: string;
  engine: string;
  make_cartridge(): Promise<Cart.Cartridge>;
}

const parsers = [BitsyImporter];

export async function candidates(files: KateTypes.DeviceFileHandle[]) {
  return (await Promise.all(parsers.map((p) => p.accepts(files)))).flat();
}
