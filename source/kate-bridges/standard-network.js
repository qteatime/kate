void function () {
  const secret = KATE_SECRET;

  async function read_file(path) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const handler = (ev) => {
        if (ev.data.type === "kate:reply" && ev.data.id === id) {
          window.removeEventListener("message", handler);
          if (ev.data.ok) {
            resolve(ev.data.result);
          } else {
            reject(new Error(`Request to ${path} failed`));
          }
        }
      };

      window.addEventListener("message", handler);
      window.parent.postMessage({
        type: "kate:read-file",
        secret: secret,
        id: id,
        path: path
      }, "*")
    });
  }

  async function get_url(url) {
    try {
      const file = await read_file(url);
      const blob = new Blob([file.data], {type: file.mime});
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("error ==>", e);
      throw e;
    }
  }

  // -- Arbitrary fetching
  const old_fetch = window.fetch;
  window.fetch = async function(request, options) {
    let url;
    let method;

    if (Object(request) === request && request.url) {
      url = request.url;
      method = request.method;
    } else {
      url = request;
      method = options?.method ?? "GET";
    }

    if (method !== "GET") {
      return new Promise((_, reject) => reject(new Error(`Non-GET requests are not supported.`)));
    }
    return new Promise(async (resolve, reject) => {
      try {
        const file = await get_url(String(url));
        const result = await old_fetch(file);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  const old_xhr_open = XMLHttpRequest.prototype.open;
  const old_xhr_send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (method !== "GET") {
      throw new Error(`Non-GET requests are not supported.`);
    }

    this.__waiting_open = true;

    void (async () => {
      try {
        const real_url = await get_url(String(url));
        old_xhr_open.call(this, "GET", real_url);
        this.__maybe_send();
      } catch (error) {
        old_xhr_open.call(this, "GET", "not-found");
        this.__maybe_send();
      }
    })();
  };

  XMLHttpRequest.prototype.__maybe_send = function() {
    this.__waiting_open = false;
    if (this.__waiting_send) {
      this.__waiting_send = false;
      this.send();
    }
  };

  XMLHttpRequest.prototype.send = function() {
    if (this.__waiting_open) {
      this.__waiting_send = true;
      return;
    } else {
      return old_xhr_send.call(this);
    }
  };

  // -- Image loading
  const old_img_src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    enumerable: old_img_src.enumerable,
    configurable: old_img_src.configurable,
    get() {
      return this.__src ?? old_img_src.get.call(this);
    },
    set(url) {
      this.__src = url;
      void (async () => {
        try {
          const real_url = await get_url(String(url));
          old_img_src.set.call(this, real_url);
        } catch (error) {
          old_img_src.set.call(this, "not-found");
        }
      })();
    }
  });

}();