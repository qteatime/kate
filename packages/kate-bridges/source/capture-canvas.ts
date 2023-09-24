/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
