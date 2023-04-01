import type {
  TableSchema,
  TableSchema1,
  TableSchema2,
  IndexSchema1,
  IndexSchema2,
} from "./schema";

function lift_request<A>(req: IDBRequest<A>): Promise<A> {
  return new Promise<A>((resolve, reject) => {
    req.onerror = (_: any) => reject(new Error(`failed`));
    req.onsuccess = (_: any) => resolve(req.result);
  });
}

export class Database {
  constructor(private db: IDBDatabase) {}

  async transaction<A>(
    tables: TableSchema<any>[],
    mode: IDBTransactionMode,
    fn: (txn: Transaction) => A
  ) {
    return new Promise<A>(async (resolve, reject) => {
      const request = this.db.transaction(
        tables.map((x) => x.name),
        mode
      );
      let result: A;

      request.onerror = (ev) => {
        reject(new Error(`cannot start transaction`));
      };
      request.onabort = (ev) => {
        reject(new Error(`transaction aborted`));
      };
      request.oncomplete = (ev) => {
        resolve(result);
      };
      const trans = new Transaction(request);
      try {
        result = await fn(trans);
        trans.commit();
      } catch (error) {
        trans.abort();
        reject(error);
      }
    });
  }
}

export class Transaction {
  constructor(private trans: IDBTransaction) {}

  commit() {
    this.trans.commit();
  }

  abort() {
    this.trans.abort();
  }

  get_table1<T extends TableSchema1<any, any>>(table: T) {
    return new Table<T["__schema1"], T["__kt1"], T["__k1"]>(
      this.trans.objectStore(table.name)
    );
  }

  get_table2<T extends TableSchema2<any, any, any>>(table: T) {
    return new Table<
      T["__schema2"],
      [T["__kt1"], T["__kt2"]],
      [T["__k1"], T["__k2"]]
    >(this.trans.objectStore(table.name));
  }

  get_index1<I extends IndexSchema1<any, any>>(index: I) {
    const store = this.trans.objectStore(index.table.name);
    return new Index<I["__schema1"], I["__kt1"], I["__k1"]>(
      store.index(index.name)
    );
  }

  get_index2<I extends IndexSchema2<any, any, any>>(index: I) {
    const store = this.trans.objectStore(index.table.name);
    return new Index<
      I["__schema2"],
      [I["__kt1"], I["__kt2"]],
      [I["__k1"], I["__k2"]]
    >(store.index(index.name));
  }
}

export class Table<Schema, Key, Props> {
  constructor(private store: IDBObjectStore) {}

  async add(value: Schema): Promise<Key> {
    return (await lift_request(this.store.add(value))) as any;
  }

  async put(value: Schema): Promise<Key> {
    return (await lift_request(this.store.put(value))) as any;
  }

  async clear() {
    await lift_request(this.store.clear());
  }

  async count(query?: Key) {
    return await lift_request(this.store.count(query as any));
  }

  async delete(query: Key) {
    return await lift_request(this.store.delete(query as any));
  }

  async get(query: Key): Promise<Schema> {
    return await lift_request(this.store.get(query as any));
  }

  async get_all(query?: Key, count?: number): Promise<Schema[]> {
    return await lift_request(this.store.getAll(query as any, count));
  }

  async try_get(query?: Key) {
    const value = await this.get_all(query, 1);
    if (value.length === 1) {
      return value[0];
    } else {
      return null;
    }
  }
}

export class Index<Schema, Key, Props> {
  constructor(private index: IDBIndex) {}

  async count(query: Key) {
    return await lift_request(this.index.count(query as any));
  }

  async get(query: Key): Promise<Schema> {
    return await lift_request(this.index.get(query as any));
  }

  async get_all(query: Key, count?: number): Promise<Schema[]> {
    return await lift_request(this.index.getAll(query as any, count));
  }
}
