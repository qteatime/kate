/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

declare var SELECTOR: string;

void (function () {
  const css = document.createElement("style");
  css.textContent = `
${SELECTOR} {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100% !important;
  height: 100% !important;
  background: #000;
  border: none;
  transform: translate(-50%, -50%);
}
  `;
  document.head.appendChild(css);
})();
