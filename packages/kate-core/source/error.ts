/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateVersion } from "./cart";
import { SemVer } from "./utils";

export class EUserError extends Error {}

export class ENoCartParser extends EUserError {
  constructor(readonly file: string) {
    super(`No suitable cartridge decoders found for: ${file}`);
  }
}

export class ECartFormatTooNew extends EUserError {
  constructor(readonly version: SemVer, readonly file: string) {
    super(`${file} requires at least Kate v${version} to decode.`);
  }
}

export class ECartCorrupted extends EUserError {
  constructor(readonly file: string) {
    super(`${file} is corrupted.`);
  }
}
