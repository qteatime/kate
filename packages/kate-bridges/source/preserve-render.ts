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

// Make sure canvas WebGL contexts are instantiated to preserve buffers
// after drawing, since screenshot and video capture cannot be synchronised
// currently.
void (function () {
  const old_get_context = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (context: any, options0: any): any {
    if (context === "webgl" || context === "webgl2") {
      const options = Object.assign({}, options0, {
        preserveDrawingBuffer: true,
      });
      return old_get_context.call(this, context, options);
    } else {
      return old_get_context.call(this, context, options0);
    }
  };
})();
