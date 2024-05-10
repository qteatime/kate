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
