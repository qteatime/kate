/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { kart_v6 as Cart } from "../deps/schema";
import { BitsyImporter } from "./bitsy";
import { RenpyImporter } from "./renpy";

export interface Parser {
  accepts(files: KateTypes.DeviceFileHandle[]): Promise<Importer[]>;
}

export type CartConfig = {
  metadata: Cart.Metadata;
  files: (() => Promise<Uint8Array>)[];
};

export interface Importer {
  title: string;
  engine: string;
  thumbnail: Uint8Array | null;
  make_cartridge(): Promise<CartConfig>;
}

const parsers = [BitsyImporter, RenpyImporter];

export async function candidates(files: KateTypes.DeviceFileHandle[]) {
  return (await Promise.all(parsers.map((p) => p.accepts(files)))).flat();
}
