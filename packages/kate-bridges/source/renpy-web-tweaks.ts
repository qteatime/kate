/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
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
