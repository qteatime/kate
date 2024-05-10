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
