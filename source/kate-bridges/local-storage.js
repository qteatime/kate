void function () {
  const {kv_store} = KateAPI;
  let contents = window.KATE_LOCAL_STORAGE ?? Object.create(null);
  
  let timer = null;
  function persist(contents) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      kv_store.replace_all(contents);
    })
  }

  class KateStorage {
    constructor(contents, persistent) {
      this.__contents = contents;
      this.__persistent = persistent;
    }

    _persist() {
      if (this.__persistent) {
        persist(this.__contents);
      }
    }

    getItem(name) {
      return this.__contents[name] ?? null;
    }

    setItem(name, value) {
      this.__contents[name] = value;
      this._persist();
    }

    removeItem(name) {
      delete this.__contents[name];
      this._persist();
    }

    clear() {
      this.__contents = Object.create(null);
      this._persist();
    }

    key(index) {
      return this.getItem(Object.keys(this.__contents)[index]) ?? null;
    }

    get length() {
      return Object.keys(this.__contents).length;
    }
  }

  function proxy_storage(storage, key) {
    const exposed = ["getItem", "setItem", "removeItem", "clear", "key"];

    Object.defineProperty(window, key, {
      value: new Proxy(storage, {
        get(target, prop, receiver) {
          return exposed.contains(prop) ? storage[prop].bind(storage) : storage.getItem(prop);
        },
        has(target, prop) {
          return exposed.contains(prop) || prop in contents;
        },
        set(target, prop, value) {
          return storage.setItem(prop, value);
        },
        deleteProperty(target, prop) {
          return storage.removeItem(prop);
        }
      })
    })
  }
  
  const storage = new KateStorage(contents, true);
  proxy_storage(storage, "localStorage");

  const session_storage = new KateStorage(Object.create(null), false);
  proxy_storage(session_storage, "sessionStorage");

}();