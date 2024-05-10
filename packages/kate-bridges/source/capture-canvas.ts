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
 *
 * This file is part of the cartridge linking exception as described
 * in COPYING.
 */

// Polls for a canvas element to provide to the Kate Capture API
declare var SELECTOR: string;

void (function () {
  const MAX_RETRIES = 60;

  function try_capture(retries: number) {
    const element = document.querySelector(SELECTOR);
    if (element instanceof HTMLCanvasElement) {
      KateAPI.capture.set_root(element);
    } else if (retries > 0) {
      setTimeout(() => try_capture(retries - 1), 1_000);
    } else {
      console.warn(
        `[Kate] Could not find '${SELECTOR}' to capture in ${MAX_RETRIES} seconds. Giving up.`
      );
    }
  }

  try_capture(MAX_RETRIES);
})();
