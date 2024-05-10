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

declare var VERSION: { major: number; minor: number };

void (function () {
  function hide_hamburger_menu() {
    switch (VERSION.major) {
      case 7:
      case 8: {
        const css = document.createElement("style");
        css.textContent = `
        #ContextContainer {
          display: none !important;
        }
        `;
        document.head.appendChild(css);
        break;
      }

      default:
        console.warn(`Unsupported Ren'Py version ${VERSION.major}`);
    }
  }

  hide_hamburger_menu();
})();
