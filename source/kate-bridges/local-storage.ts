import { KateAPI } from "../kate-api";
type Dict = { [key: string]: string };
declare var KateAPI: KateAPI;
declare var KATE_LOCAL_STORAGE: Dict | null;

const { kv_store } = KateAPI;
let contents = KATE_LOCAL_STORAGE ?? Object.create(null);

let timer: any = null;
function persist(contents: Dict) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    kv_store.replace_all(contents);
  });
}

class KateStorage {
  private __contents: Dict;
  private __persistent: boolean;

  constructor(contents: Dict, persistent: boolean) {
    this.__contents = contents;
    this.__persistent = persistent;
  }

  _persist() {
    if (this.__persistent) {
      persist(this.__contents);
    }
  }

  getItem(name: string) {
    return this.__contents[name] ?? null;
  }

  setItem(name: string, value: string) {
    this.__contents[name] = value;
    this._persist();
  }

  removeItem(name: string) {
    delete this.__contents[name];
    this._persist();
  }

  clear() {
    this.__contents = Object.create(null);
    this._persist();
  }

  key(index: number) {
    return this.getItem(Object.keys(this.__contents)[index]) ?? null;
  }

  get length() {
    return Object.keys(this.__contents).length;
  }
}

function proxy_storage(storage: KateStorage, key: string) {
  const exposed = ["getItem", "setItem", "removeItem", "clear", "key"];

  Object.defineProperty(window, key, {
    value: new Proxy(storage, {
      get(target, prop, receiver) {
        return exposed.includes(prop as any)
          ? (storage as any)[prop].bind(storage)
          : storage.getItem(prop as any);
      },
      has(target, prop) {
        return exposed.includes(prop as any) || prop in contents;
      },
      set(target, prop, value) {
        storage.setItem(prop as any, value);
        return true;
      },
      deleteProperty(target, prop) {
        storage.removeItem(prop as any);
        return true;
      },
    }),
  });
}

const storage = new KateStorage(contents, true);
proxy_storage(storage, "localStorage");

const session_storage = new KateStorage(Object.create(null), false);
proxy_storage(session_storage, "sessionStorage");
