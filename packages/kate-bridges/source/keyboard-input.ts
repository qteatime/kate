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

// This proxy translates Kate's input (keyboard, gamepad, and virtual console)
// into keyboard events in this page. Mappings are provided when instantiating
// this bridge.
declare var KEY_MAPPING: { [key: string]: [string, string, number] };

// The element that should receive the keyboard input events.
declare var SELECTOR: string | "window" | "document" | "legacy";

void (function () {
  const MAX_RETRIES = 60;
  let paused = false;
  const { events } = KateAPI;
  const down = new Set<KateTypes.InputKey>();
  let dispatch: (ev: Event) => void = (ev: Event) => {};

  const on_key_update = ({
    button: kate_key,
    is_pressed,
  }: {
    button: KateTypes.InputKey;
    is_pressed: boolean;
  }) => {
    if (!paused) {
      const data = KEY_MAPPING[kate_key];
      if (data) {
        if (is_pressed) {
          down.add(kate_key);
        } else {
          down.delete(kate_key);
        }
        const type = is_pressed ? "keydown" : "keyup";
        const [key, code, keyCode] = data;
        const key_ev = new KeyboardEvent(type, { key, code, keyCode });
        dispatch(key_ev);
      }
    }
  };

  function start(new_dispatch: (ev: Event) => void) {
    dispatch = new_dispatch;
    events.input_state_changed.listen(on_key_update);

    events.paused.listen((state) => {
      if (state === true) {
        for (const key of down) {
          on_key_update({ button: key, is_pressed: false });
        }
      }
      paused = state;
    });
  }

  function try_start(retries: number) {
    switch (SELECTOR) {
      case "window": {
        return start((x) => window.dispatchEvent(x));
      }

      case "document": {
        return start((x) => document.dispatchEvent(x));
      }

      case "legacy": {
        return start((x) => {
          window.dispatchEvent(x);
          document.dispatchEvent(x);
        });
      }

      default: {
        const element = document.querySelector(SELECTOR);
        if (element != null) {
          return start((x) => element.dispatchEvent(x));
        } else if (retries > 0) {
          setTimeout(() => try_start(retries - 1), 1_000);
        } else {
          console.warn(
            `[Kate] coult not find '${SELECTOR}' to capture in ${MAX_RETRIES} seconds. Giving up`
          );
        }
      }
    }
  }

  // Disable gamepad input
  Object.defineProperty(navigator, "getGamepads", {
    enumerable: false,
    configurable: false,
    value: () => [null, null, null, null],
  });

  try_start(MAX_RETRIES);
})();
