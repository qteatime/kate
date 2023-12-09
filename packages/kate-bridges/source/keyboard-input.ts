/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
