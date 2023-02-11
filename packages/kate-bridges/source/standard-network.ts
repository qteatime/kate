export {};

const { cart_fs } = KateAPI;

// -- Arbitrary fetching
const old_fetch = window.fetch;
window.fetch = async function (request: any, options) {
  let url: any;
  let method: any;

  if (Object(request) === request && request.url) {
    url = request.url;
    method = request.method;
  } else {
    url = request;
    method = options?.method ?? "GET";
  }

  if (method !== "GET") {
    return new Promise((_, reject) =>
      reject(new Error(`Non-GET requests are not supported.`))
    );
  }
  return new Promise(async (resolve, reject) => {
    try {
      const file = await cart_fs.get_file_url(String(url));
      const result = await old_fetch(file);
      resolve(result);
    } catch (error) {
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
XMLHttpRequest.prototype.open = function (this: XMLHttpRequestE, method, url) {
  if (method !== "GET") {
    throw new Error(`Non-GET requests are not supported.`);
  }

  this.__waiting_open = true;

  void (async () => {
    try {
      const real_url = await cart_fs.get_file_url(String(url));
      old_xhr_open.call(this, "GET", real_url, true);
      this.__maybe_send();
    } catch (error) {
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
  set(url) {
    this.__src = url;
    void (async () => {
      try {
        const real_url = await cart_fs.get_file_url(String(url));
        old_img_src.set!.call(this, real_url);
      } catch (error) {
        old_img_src.set!.call(this, "not-found");
      }
    })();
  },
});
