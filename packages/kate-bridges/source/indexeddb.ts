declare var VERSIONED: boolean;

void (function () {
  const { store } = KateAPI;

  function partition() {
    if (VERSIONED) {
      return store.versioned();
    } else {
      return store.unversioned();
    }
  }

  const DB_META_KEY = "kate:idb-bridge:metadata";

  function defer<A>() {
    const result: {
      promise: Promise<A>;
      resolve: (_: A) => void;
      reject: (_: any) => void;
    } = {} as any;
    result.promise = new Promise((resolve, reject) => {
      result.resolve = resolve;
      result.reject = reject;
    });
    return result;
  }

  type Job<A> = () => Promise<A>;

  class JobQueue {
    readonly _jobs: Job<any>[] = [];
    private _busy: boolean = false;

    async submit<A>(job: Job<A>): Promise<A> {
      const result = defer<A>();
      this._jobs.push(async () => {
        job().then(
          (value) => result.resolve(value),
          (error) => result.reject(error)
        );
      });
      this.process();
      return result.promise;
    }

    submit_request<A>(
      req: KDBRequest<A>,
      job: (_: KDBRequest<A>) => Promise<A>
    ) {
      return request(req, async (req) => {
        return this.submit(async () => {
          return job(req);
        });
      });
    }

    private async process() {
      if (this._busy) {
        return;
      }
      this._busy = true;
      while (this._jobs.length > 0) {
        const job = this._jobs.shift()!;
        await job().catch((error) => {
          console.error(`[Kate][IDBBridge] job failed`, error);
        });
      }
      this._busy = false;
    }
  }

  const queue = new JobQueue();

  class KDBRequest<A> extends EventTarget {
    public _error: DOMException | null = null;
    public _result: A | null = null;
    public _source: any = null;
    public _ready_state: "pending" | "done" = "pending";
    public _transaction: KDBTransaction | null = null;
    readonly _deferred = defer<A>();

    get error() {
      return this._error;
    }

    get result() {
      return this._result;
    }

    get source() {
      return this._source;
    }

    get readyState() {
      return this._ready_state;
    }

    get transaction() {
      return this._transaction;
    }

    set onsuccess(value: any) {
      this.addEventListener("success", value);
    }

    set onerror(value: any) {
      this.addEventListener("error", value);
    }

    do_success(value: A) {
      const event = new CustomEvent("success");
      Object.defineProperty(event, "target", {
        configurable: true,
        value: { result: value },
      });
      this._result = value;
      this._ready_state = "done";
      this.dispatchEvent(event);
      this._deferred.resolve(value);
    }

    do_error(reason: any) {
      const event = new CustomEvent("error");
      this._error = reason;
      this._ready_state = "done";
      this.dispatchEvent(event);
      this._deferred.reject(reason);
    }
  }

  class KDBOpenRequest extends KDBRequest<any> {
    set onupgradeneeded(value: any) {
      this.addEventListener("upgradeneeded", value);
    }
  }

  function cursor_request(cursor: KDBCursor) {
    setTimeout(() => {
      cursor.req.do_success(cursor.records.length > 0 ? cursor : null);
    });
    return cursor.req;
  }

  function request<A>(
    req: KDBRequest<A>,
    fn: (req: KDBRequest<A>) => Promise<A>
  ) {
    fn(req).then(
      (value) => req.do_success(value),
      (error) => req.do_error(error)
    );
    return req;
  }

  type DBIndexMeta = {
    name: string;
    key_path: string[];
    unique: boolean;
    multi_entry: boolean;
  };

  type DBStoreMeta = {
    name: string;
    key_path: string[] | null;
    auto_increment: boolean;
    sequence_id: number;
    indexes: DBIndexMeta[];
    data: { key: any; value: any }[];
  };

  type DBMeta = { name: string; version: number; stores: DBStoreMeta[] };

  class KDBFactory {
    open(name: string, version: number = 1) {
      return queue.submit_request(new KDBOpenRequest(), async (req) => {
        const meta = await partition().ensure_bucket(DB_META_KEY);
        const db = ((await meta.try_read_data(name)) as DBMeta | null) ?? {
          name,
          version: 0,
          stores: [],
        };
        await meta.write_structured(name, { name, version, stores: db.stores });
        const kdb = new KDBDatabase(db);
        if (version !== db.version) {
          const ev = new CustomEvent("upgradeneeded");
          (ev as any).oldVersion = db.version;
          (ev as any).newVersion = version;
          Object.defineProperty(ev, "target", {
            configurable: true,
            value: {
              result: kdb,
              transaction: new KDBTransaction(
                kdb,
                db.stores.map((x) => new KDBObjectStore(kdb, x))
              ),
            },
          });
          req.dispatchEvent(ev);
          db.version = 1;
          kdb._flush();
        }
        return kdb;
      });
    }

    deleteDatabase(name: string) {
      return queue.submit_request(new KDBOpenRequest(), async (req) => {
        const meta = await partition().ensure_bucket(DB_META_KEY);
        await meta.delete(name);
      });
    }

    databases() {
      return queue.submit(async () => {
        const meta = await partition().ensure_bucket(DB_META_KEY);
        const db_keys = await meta.list();
        const dbs = (await Promise.all(
          db_keys.map((x) => meta.read_data(x.key))
        )) as DBMeta[];
        return dbs.map((x) => x.name);
      });
    }
  }

  class KDBDatabase {
    constructor(readonly _meta: DBMeta) {}

    get name() {
      return this._meta.name;
    }

    get version() {
      return this._meta.version;
    }

    get objectStoreNames() {
      return dom_list(this._meta.stores.map((x) => x.name));
    }

    close() {}

    createObjectStore(
      name: string,
      options?: { keyPath?: string | string[]; autoIncrement?: boolean }
    ) {
      if (this._meta.stores.find((x) => x.name === name)) {
        throw new DOMException(
          `Duplicate object store ${name}`,
          "ContraintError"
        );
      }
      const key_path0 = options?.keyPath ?? [];
      const key_path = Array.isArray(key_path0) ? key_path0 : [key_path0];
      if (!key_path.every((x) => typeof x === "string")) {
        throw new DOMException("Invalid key path", "ConstraintError");
      }
      const store_meta = {
        name,
        sequence_id: 0,
        key_path: key_path,
        auto_increment: options?.autoIncrement ?? false,
        indexes: [],
        data: [],
      };
      this._meta.stores.push(store_meta);
      this._flush();
      return new KDBObjectStore(this, store_meta);
    }

    deleteObjectStore(name: string) {
      const index = this._meta.stores.findIndex((x) => x.name === name);
      if (index === -1) {
        throw new DOMException(`Undefined store ${name}`, "NotFoundError");
      }
      this._meta.stores.splice(index, 1);
      this._flush();
    }

    // The IDBBridge is **NOT** transactional!!!
    transaction(stores0: string | string[]) {
      const stores1 = Array.isArray(stores0) ? stores0 : [stores0];
      const stores = stores1.map((n) =>
        this._meta.stores.find((x) => x.name === n)
      );
      if (!stores.every((x) => x != null)) {
        throw new DOMException(`Some stores not found`, "NotFoundError");
      }
      return new KDBTransaction(
        this,
        stores.map((x) => new KDBObjectStore(this, x!))
      );
    }

    async _flush() {
      return queue.submit(async () => {
        const meta = await partition().ensure_bucket(DB_META_KEY);
        await meta.write_structured(this.name, this._meta);
      });
    }
  }

  class KDBObjectStore {
    constructor(readonly _db: KDBDatabase, readonly _meta: DBStoreMeta) {}

    get indexNames() {
      return dom_list(this._meta.indexes.map((x) => x.name));
    }

    get autoIncrement() {
      return this._meta.auto_increment;
    }

    get keyPath() {
      return this._meta.key_path;
    }

    get name() {
      return this._meta.name;
    }

    add(value: any, key?: any) {
      const id = this._resolve_key(value, key);
      if (this._has(id)) {
        throw new DOMException(`Duplicated id ${id}`, "ConstraintError");
      }
      this._meta.data.push({ key: id, value });
      return queue.submit_request(new KDBRequest(), async (req) => {
        await this._flush();
        return id;
      });
    }

    clear() {
      this._meta.data = [];
      return queue.submit_request(new KDBRequest(), async (req) => {
        await this._flush();
      });
    }

    count(query: any) {
      let result = 0;
      for (const _ of search(query, this._meta.data)) {
        result += 1;
      }
      return request(new KDBRequest(), async (_) => result);
    }

    delete(query: any) {
      const items = search(query, this._meta.data);
      for (const { key } of items) {
        this._meta.data = this._meta.data.filter((x) => key !== x.key);
      }
      return queue.submit_request(new KDBRequest(), async (req) => {
        await this._flush();
      });
    }

    get(query: any) {
      const item = [...search(query, this._meta.data)][0];
      return request(new KDBRequest(), async (req) => {
        return item?.value;
      });
    }

    getAll(query: any, count: number = 2 ** 32 - 1) {
      const items = [...search(query, this._meta.data)].slice(0, count);
      return request(new KDBRequest(), async (req) => {
        return items.map((x) => x.value);
      });
    }

    getAllKeys(query: any, count: number = 2 ** 32 - 1) {
      const items = [...search(query, this._meta.data)].slice(0, count);
      return request(new KDBRequest(), async (req) => {
        return items.map((x) => x.key);
      });
    }

    getKey(query: any) {
      const item = [...search(query, this._meta.data)][0];
      return request(new KDBRequest(), async (req) => {
        return item?.key;
      });
    }

    put(value: any, key: any) {
      const id = this._resolve_key(value, key);
      const index = this._meta.data.findIndex((x) => match(id, x.key));
      if (index === -1) {
        this._meta.data.push({ key: id, value: value });
      } else {
        this._meta.data.splice(index, 1, { key: id, value: value });
      }
      return queue.submit_request(new KDBRequest(), async (req) => {
        await this._flush();
        return id;
      });
    }

    openCursor(query: any = null, direction: string = "next") {
      const records = [...search(query, this._meta.data)]
        .sort((a, b) => cmp(a.key, b.key))
        .map((x) => ({ key: x.key, primaryKey: x.key, value: x.value }));
      return cursor_request(
        new KDBCursor(
          new KDBRequest(),
          records,
          direction as any,
          (x) => x.value
        )
      );
    }

    openKeyCursor(query: any = null, direction: string = "next") {
      const records = [...search(query, this._meta.data)]
        .sort((a, b) => cmp(a.key, b.key))
        .map((x) => ({ key: x.key, primaryKey: x.key, value: x.value }));
      return cursor_request(
        new KDBCursor(new KDBRequest(), records, direction as any, (x) => x.key)
      );
    }

    createIndex(
      name: string,
      key_path: any,
      options?: { unique?: boolean; multiEntry?: boolean }
    ) {
      if (this._meta.indexes.find((x) => x.name === name)) {
        throw new DOMException(
          `Duplicate index name ${name}`,
          "ConstraintError"
        );
      }
      if (options?.multiEntry) {
        throw new Error(
          `[Kate][IDBBridge] multiEntry indexes are not supported`
        );
      }

      const meta = {
        name: name,
        key_path: Array.isArray(key_path) ? key_path : [key_path],
        multi_entry: options?.multiEntry ?? false,
        unique: options?.unique ?? false,
      };
      this._meta.indexes.push(meta);
      this._flush();
      return new KDBIndex(this, meta);
    }

    deleteIndex(name: string) {
      const index = this._meta.indexes.findIndex((x) => x.name === name);
      if (index === -1) {
        throw new DOMException(`Unknown index ${name}`, "NotFoundError");
      }
      this._meta.indexes.splice(index, 1);
      this._flush();
    }

    index(name: string) {
      const index = this._meta.indexes.find((x) => x.name === name);
      if (index == null) {
        throw new DOMException(`Unknown index ${name}`, "NotFoundError");
      }
      return new KDBIndex(this, index);
    }

    _has(key: any) {
      return this._meta.data.some((x) => match(key, x.key));
    }

    _resolve_key(value: any, key?: any) {
      if (key != null) {
        return key;
      }

      const paths = this._meta.key_path as any[];
      if (paths.length === 0) {
        throw new Error(`Auto-increment keys unsupported`);
      } else if (paths.length === 1) {
        return get_path(value, paths[0]);
      } else {
        return paths.map((x) => get_path(value, x));
      }
    }

    _flush() {
      return this._db._flush();
    }
  }

  class KDBIndex {
    constructor(readonly _store: KDBObjectStore, readonly _meta: DBIndexMeta) {}

    get keyPath() {
      return this._meta.key_path;
    }

    get multiEntry() {
      return this._meta.multi_entry;
    }

    get name() {
      return this._meta.name;
    }

    get unique() {
      return this._meta.unique;
    }

    get objectStore() {
      return this._store;
    }

    count(query: any) {
      const items = linear_search(query, this._make_index());
      return request(new KDBRequest(), async (req) => {
        return [...items].length;
      });
    }

    get(query: any) {
      const item = [...linear_search(query, this._make_index())][0];
      return request(new KDBRequest(), async (req) => {
        return item?.value;
      });
    }

    getAll(query: any, count: number = 2 ** 32 - 1) {
      const items = [...linear_search(query, this._make_index())].slice(
        0,
        count
      );
      return request(new KDBRequest(), async (req) => {
        return items.map((x) => x.value);
      });
    }

    getAllKeys(query: any, count: number = 2 ** 32 - 1) {
      const items = [...linear_search(query, this._make_index())].slice(
        0,
        count
      );
      return request(new KDBRequest(), async (req) => {
        return items.map((x) => x.key);
      });
    }

    getKey(query: any) {
      const item = [...linear_search(query, this._make_index())][0];
      return request(new KDBRequest(), async (req) => {
        return item?.key;
      });
    }

    openCursor(query: any = null, direction: string = "next") {
      const records = [...linear_search(query, this._make_index())].sort(
        (a, b) => cmp(a.key, b.key)
      );
      return cursor_request(
        new KDBCursor(
          new KDBRequest(),
          records,
          direction as any,
          (x) => x.value
        )
      );
    }

    openKeyCursor(query: any = null, direction: string = "next") {
      const records = [...linear_search(query, this._make_index())].sort(
        (a, b) => cmp(a.key, b.key)
      );
      return cursor_request(
        new KDBCursor(new KDBRequest(), records, direction as any, (x) => x.key)
      );
    }

    _make_index() {
      const result: { key: any; primaryKey: any; value: any }[] = [];
      for (const { key: k, value: v } of this._store._meta.data) {
        const key0 = this.keyPath.map((x) => v[x as any]);
        const key = key0.length === 1 ? key0[0] : key0;
        result.push({ key, primaryKey: k, value: v });
      }
      return result;
    }
  }

  class KDBCursor {
    private _index: number;
    private _step: number;
    constructor(
      readonly req: KDBRequest<any>,
      readonly records: { key: any; primaryKey: any; value: any }[],
      direction: "next" | "nextunique" | "prev" | "prevunique",
      readonly reify: (_: { key: any; value: any }) => any
    ) {
      this._index = direction.startsWith("next") ? 0 : records.length;
      this._step = direction.startsWith("next") ? 1 : -1;
    }

    get _current() {
      const item = this.records[this._index];
      return item;
    }

    get key() {
      return this._current.key;
    }

    get primaryKey() {
      return this._current.primaryKey;
    }

    advance(count: number) {
      if (count <= 0) {
        throw new TypeError("Invalid advance count");
      }
      const index = this._index + this._step * count;
      if (index <= 0 || index >= this.records.length) {
        this.req.do_success(null);
        return;
      }
      this._index = index;
      this.req.do_success(this);
    }

    continue(query: any) {
      if (query == null) {
        this.advance(1);
      } else {
        throw new Error(`[Kate][IDBBridge] Not supported: continue with key`);
      }
    }

    continuePrimaryKey() {
      throw new Error(`[Kate][IDBBridge] Not supported: continue with key`);
    }

    delete() {
      throw new Error(`[Kate][IDBBridge] Not supported: continue with key`);
    }

    update() {
      throw new Error(`[Kate][IDBBridge] Not supported: continue with key`);
    }
  }

  function lift_query(query: any) {
    if (query == null) {
      return null;
    } else if (Array.isArray(query) && query.length === 1) {
      return query[0];
    } else {
      return query;
    }
  }

  function* search(query0: any, items: { key: any; value: any }[]) {
    const query = lift_query(query0);
    for (const { key, value } of items) {
      if (match(query, key)) {
        yield { key, value };
      }
    }
  }

  function* linear_search(
    query0: any,
    items: Iterable<{ key: any; primaryKey: any; value: any }>
  ) {
    const query = lift_query(query0);
    for (const { key, primaryKey, value } of items) {
      if (match(query, key)) {
        yield { key, primaryKey, value };
      }
    }
  }

  function match(query: any, key: any): boolean {
    if (query == null) {
      return true;
    } else if (Array.isArray(query) && Array.isArray(key)) {
      return query.every((q, i) => match(q, key[i]));
    } else if (query instanceof IDBKeyRange) {
      if (Array.isArray(key)) {
        return query.includes(key[0]);
      } else {
        return query.includes(key);
      }
    } else {
      return query === key;
    }
  }

  class KDBTransaction extends EventTarget {
    constructor(readonly _db: KDBDatabase, readonly _stores: KDBObjectStore[]) {
      super();
    }

    get db() {
      return this._db;
    }

    get durability() {
      return "relaxed";
    }

    get mode() {
      return "readwrite";
    }

    get objectStoreNames() {
      return dom_list(this._stores.map((x) => x.name));
    }

    abort() {
      console.warn(
        `[Kate][IDBBridge] Kate's IndexedDB bridge is not transactional!`
      );
    }

    commit() {
      const ev = new CustomEvent("complete");
      this.dispatchEvent(ev);
    }

    set oncomplete(fn: any) {
      this.addEventListener("complete", fn);
    }

    set onerror(fn: any) {
      this.addEventListener("error", fn);
    }

    set onabort(fn: any) {
      console.warn(
        `[Kate][IDBBridge] Kate's IndexedDB bridge is not transactional!`
      );
    }

    objectStore(name: string) {
      const store = this._stores.find((x) => x.name === name);
      if (store == null) {
        throw new DOMException(
          `Store not in this transaction ${name}`,
          "NotFoundError"
        );
      }
      return store;
    }
  }

  function get_path(value: any, path: string) {
    const keys = path.split(".");
    return keys.reduce((v, k) => v[k], value);
  }

  function cmp(a: any, b: any): number {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.reduce((x, i) => cmp(x, b[i as number]), 0) as number;
    } else if (typeof a === "number" && typeof b === "number") {
      return a - b;
    } else if (typeof a === "string" && typeof b === "string") {
      return a.localeCompare(b);
    } else {
      const va = a as any;
      const vb = b as any;
      return va < vb ? -1 : va > vb ? 1 : 0;
    }
  }

  function dom_list(names: string[]) {
    Object.defineProperty(names, "contains", {
      configurable: true,
      value: (name: string) => {
        return names.includes(name);
      },
    });
    Object.defineProperty(names, "item", {
      configurable: true,
      value: (index: number) => {
        return names[index];
      },
    });
    return names;
  }

  Object.defineProperty(window, "indexedDB", {
    configurable: true,
    value: new KDBFactory(),
  });
})();
