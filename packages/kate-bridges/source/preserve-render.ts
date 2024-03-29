/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Make sure canvas WebGL contexts are instantiated to preserve buffers
// after drawing, since screenshot and video capture cannot be synchronised
// currently.
void (function () {
  const old_get_context = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    context: any,
    options0: any
  ): any {
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
