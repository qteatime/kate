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

import type { PointerButton } from "../../kate-api/source/pointer-input";

// This proxy translates Kate's pointer input API (mouse movement/click)
// into regular web pointer events. You provide an element that will
// receive the events.
declare var SELECTOR: string;
declare var HIDE_CURSOR: boolean;

void (function () {
  const MAX_RETRIES = 60;

  function try_monitor(retries: number) {
    const element = document.querySelector(SELECTOR);
    if (element instanceof HTMLElement) {
      do_monitor(element);
    } else if (retries > 0) {
      setTimeout(() => try_monitor(retries - 1), 1_000);
    } else {
      console.warn(
        `[Kate] could not find '${SELECTOR}' to proxy pointer events in ${MAX_RETRIES} seconds. Giving up.`
      );
    }
  }

  function do_monitor(element: HTMLElement) {
    const pointer = KateAPI.pointer_input;
    const bounds = element.getBoundingClientRect();
    function to_button_id(button: PointerButton) {
      switch (button) {
        case "primary":
          return 0;
        case "alternate":
          return 1;
        default:
          throw new Error(`invalid button ${button}`);
      }
    }
    function translate_location(ev: KateTypes.PointerLocation) {
      return {
        x: ev.x - bounds.x,
        y: ev.y - bounds.y,
      };
    }
    function make_move_event(ev0: KateTypes.PointerLocation) {
      const ev = translate_location(ev0);
      return new MouseEvent("mousemove", {
        screenX: ev.x,
        screenY: ev.y,
        clientX: ev.x,
        clientY: ev.y,
      });
    }
    function make_press_event(
      type: "mousedown" | "mouseup" | "click" | "contextmenu",
      ev0: KateTypes.PointerClick
    ) {
      const loc = translate_location(ev0.location);
      return new MouseEvent(type, {
        screenX: loc.x,
        screenY: loc.y,
        clientX: loc.x,
        clientY: loc.y,
        button: to_button_id(ev0.button),
      });
    }

    if (HIDE_CURSOR) {
      element.style.cursor = "none";
    }

    pointer.on_moved.listen((ev0) => {
      const ev = make_move_event(ev0);
      element.dispatchEvent(ev);
    });

    pointer.on_down.listen((ev0) => {
      element.dispatchEvent(make_press_event("mousedown", ev0));
    });

    pointer.on_up.listen((ev0) => {
      element.dispatchEvent(make_press_event("mouseup", ev0));
    });

    pointer.on_clicked.listen((ev0) => {
      const type = ev0.button === "primary" ? "click" : "contextmenu";
      element.dispatchEvent(make_press_event(type, ev0));
    });
  }

  try_monitor(MAX_RETRIES);
})();
