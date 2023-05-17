import type {
  TableSchema,
  TableSchema1,
  TableSchema2,
  IndexSchema1,
  IndexSchema2,
  TableSchema3,
} from "./schema";

function lift_request<A>(req: IDBRequest<A>): Promise<A> {
  return new Promise<A>((resolve, reject) => {
    req.onerror = (_: any) => reject(new Error(`failed`));
    req.onsuccess = (_: any) => resolve(req.result);
  });
}

type IRange<A> = IDBKeyRange & { __range: "range" };

type QueryArray<T> = T extends [infer A, infer B, infer C]
  ? [A, B, C] | IRange<[A, B, C]>
  : T extends [infer A, infer B]
  ? [A, B] | IRange<[A, B]>
  : T extends [infer A]
  ? [A] | IRange<[A]>
  : T | IRange<T>;

export class Range {
  static from<A>(
    key: A,
    x: { inclusive: boolean } = { inclusive: true }
  ): IRange<A> {
    return IDBKeyRange.lowerBound(key, !x.inclusive) as IRange<A>;
  }

  static to<A>(
    key: A,
    x: { inclusive: boolean } = { inclusive: true }
  ): IRange<A> {
    return IDBKeyRange.upperBound(key, !x.inclusive) as IRange<A>;
  }

  static between<A>(
    lower: A,
    upper: A,
    x: { lower_inclusive: boolean; upper_inclusive: boolean } = {
      lower_inclusive: true,
      upper_inclusive: true,
    }
  ): IRange<A> {
    return IDBKeyRange.bound(
      lower,
      upper,
      !x.lower_inclusive,
      !x.upper_inclusive
    ) as IRange<A>;
  }

  static exactly<A>(key: A): IRange<A> {
    return IDBKeyRange.only(key) as IRange<A>;
  }
}

export class Database {
  constructor(private db: IDBDatabase) {}

  get version() {
    return this.db.version;
  }

  async delete_database() {
    this.db.close();
    await lift_request(indexedDB.deleteDatabase(this.db.name));
  }

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

  get_table3<T extends TableSchema3<any, any, any, any>>(table: T) {
    return new Table<
      T["__schema3"],
      [T["__kt1"], T["__kt2"], T["__kt3"]],
      [T["__k1"], T["__k2"], T["__k3"]]
    >(this.trans.objectStore(table.name));
  }

  get_index1<I extends IndexSchema1<any, any>>(index: I) {
    const store = this.trans.objectStore(index.table.name);
    return new Index<I["__schema1"], [I["__kt1"]], [I["__k1"]]>(
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
    if (value === undefined) {
      throw new Error(`'undefined' is not supported as a value`);
    }
    return (await lift_request(this.store.add(value))) as any;
  }

  async put(value: Schema): Promise<Key> {
    if (value === undefined) {
      throw new Error(`'undefined' is not supported as a value`);
    }
    return (await lift_request(this.store.put(value))) as any;
  }

  async clear() {
    await lift_request(this.store.clear());
  }

  async count(query?: QueryArray<Key>) {
    return await lift_request(this.store.count(query as any));
  }

  async delete(query: Key) {
    return await lift_request(this.store.delete(query as any));
  }

  async get(query: Key): Promise<Schema> {
    const result = await lift_request(this.store.get(query as any));
    if (result === undefined) {
      throw new Error(`key not found: ${query}`);
    }
    return result;
  }

  async get_all(query?: QueryArray<Key>, count?: number): Promise<Schema[]> {
    return await lift_request(this.store.getAll(query as any, count));
  }

  async try_get(query: Key): Promise<Schema | null> {
    const value = await lift_request(this.store.get(query as any));
    if (value === undefined) {
      return null;
    } else {
      return value;
    }
  }
}

export class Index<Schema, Key, Props> {
  constructor(private index: IDBIndex) {}

  async count(query: QueryArray<Key>) {
    return await lift_request(this.index.count(query as any));
  }

  async get(query: Key): Promise<Schema> {
    return await lift_request(this.index.get(query as any));
  }

  async get_all(query?: QueryArray<Key>, count?: number): Promise<Schema[]> {
    return await lift_request(this.index.getAll(query as any, count));
  }
}
