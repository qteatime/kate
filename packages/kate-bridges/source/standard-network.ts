/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Resolve GETs on the same domain to reads from the cartridge files.
// This handles fetch, XMLHttpRequest, IMG, Audio, and Video.
void (function () {
  const { cart_fs } = KateAPI;

  function is_data_url(x: any) {
    if (typeof x !== "string") {
      return false;
    } else {
      return /^data:\w+\/\w+;base64,/.test(x) || /^blob:/.test(x);
    }
  }

  function fix_url(url0: string) {
    if (is_data_url(url0)) {
      return url0;
    }

    const url = new URL(url0, "https://cartridge.kate.qteati.me");
    if (url.hostname !== "cartridge.kate.qteati.me") {
      console.warn(`[Kate] Non-proxyable URL:`, url0);
      return url0;
    } else {
      return decodeURIComponent(url.pathname);
    }
  }

  // -- Arbitrary fetching
  const old_fetch = window.fetch;
  window.fetch = async function (request: any, options) {
    let url: any;
    let method: any;

    if (Object(request) === request && request.url) {
      url = fix_url(request.url);
      method = request.method;
    } else {
      url = fix_url(request);
      method = options?.method ?? "GET";
    }

    if (method !== "GET") {
      return new Promise((_, reject) =>
        reject(new Error(`Non-GET requests are not supported.`))
      );
    }
    if (is_data_url(url)) {
      return old_fetch(url);
    }

    return new Promise(async (resolve, reject) => {
      try {
        const file = await cart_fs.get_file_url(String(url));
        const result = await old_fetch(file);
        resolve(result);
      } catch (error) {
        console.error(`[Kate] failed to fetch ${url}`);
        reject(error);
      }
    });
  };

  type XMLHttpRequestE = XMLHttpRequest & {
    __waiting_open: boolean;
    __waiting_send: boolean;
    __maybe_send: () => void;
  };
  const old_xhr_open = XMLHttpRequest.prototype.open;
  const old_xhr_send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequestE,
    method,
    url
  ) {
    if (method !== "GET") {
      throw new Error(`Non-GET requests are not supported.`);
    }
    this.__waiting_open = true;

    void (async () => {
      try {
        const real_url = await cart_fs.get_file_url(fix_url(String(url)));
        old_xhr_open.call(this, "GET", real_url, true);
        this.__maybe_send();
      } catch (error) {
        console.error(`[Kate] failed to fetch with XHR ${url}`);
        old_xhr_open.call(this, "GET", "not-found", true);
        this.__maybe_send();
      }
    })();
  };

  (XMLHttpRequest.prototype as XMLHttpRequestE).__maybe_send = function () {
    this.__waiting_open = false;
    if (this.__waiting_send) {
      this.__waiting_send = false;
      this.send();
    }
  };

  XMLHttpRequest.prototype.setRequestHeader = function (
    name: string,
    value: string
  ) {
    // Do nothing, there's no HTTP server handling these.
  };

  XMLHttpRequest.prototype.send = function (this: XMLHttpRequestE) {
    if (this.__waiting_open) {
      this.__waiting_send = true;
      return;
    } else {
      return old_xhr_send.call(this);
    }
  };

  // -- Image loading
  const old_img_src = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "src"
  )!;
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    enumerable: old_img_src.enumerable,
    configurable: old_img_src.configurable,
    get() {
      return this.__src ?? old_img_src.get!.call(this);
    },
    set(url0) {
      const url = fix_url(url0);

      this.__src = url;
      if (is_data_url(url)) {
        old_img_src.set!.call(this, url);
        return;
      }

      void (async () => {
        try {
          const real_url = await cart_fs.get_file_url(String(url));
          old_img_src.set!.call(this, real_url);
        } catch (error) {
          console.error(`[Kate] failed to load image ${url}`);
          old_img_src.set!.call(this, "not-found");
        }
      })();
    },
  });

  // -- Script loading
  const old_script_src = Object.getOwnPropertyDescriptor(
    HTMLScriptElement.prototype,
    "src"
  )!;
  Object.defineProperty(HTMLScriptElement.prototype, "src", {
    enumerable: old_script_src.enumerable,
    configurable: old_script_src.configurable,
    get() {
      return this.__src ?? old_script_src.get!.call(this);
    },
    set(url0) {
      const url = fix_url(url0);
      this.__src = url;
      if (is_data_url(url)) {
        old_script_src.set!.call(this, url);
        return;
      }

      void (async () => {
        try {
          const real_url = await cart_fs.get_file_url(String(url));
          old_script_src.set!.call(this, real_url);
        } catch (error) {
          console.error(`[Kate] failed to load script ${url}`);
          old_script_src.set!.call(this, "not-found");
        }
      })();
    },
  });

  // -- Media loading
  const old_media_src = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    "src"
  )!;
  Object.defineProperty(HTMLMediaElement.prototype, "src", {
    enumerable: old_media_src.enumerable,
    configurable: old_media_src.configurable,
    get() {
      return this.__src ?? old_media_src.get!.call(this);
    },
    set(url0) {
      const url = fix_url(url0);

      this.__src = url;
      if (is_data_url(url)) {
        old_media_src.set!.call(this, url);
        return;
      }

      void (async () => {
        try {
          const real_url = await cart_fs.get_file_url(String(url));
          old_media_src.set!.call(this, real_url);
        } catch (error) {
          console.error(`[Kate] failed to load media ${url}`);
          old_media_src.set!.call(this, "not-found");
        }
      })();
    },
  });
})();
