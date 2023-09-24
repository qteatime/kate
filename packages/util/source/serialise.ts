/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function serialise_error(x: any) {
  if (x == null) {
    return null;
  } else if (x instanceof Error) {
    return {
      name: x.name,
      message: x.message,
      stack: x.stack ?? null,
    };
  } else {
    return String(x);
  }
}
