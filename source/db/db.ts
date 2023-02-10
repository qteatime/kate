import { TableSchema } from "./schema";

function lift_request<A>(req: IDBRequest<A>): Promise<A> {
  return new Promise<A>((resolve, reject) => {
    req.onerror = (_: any) => reject(new Error(`failed`));
    req.onsuccess = (_: any) => resolve(req.result);
  });
}

export class Database {
  constructor(private db: IDBDatabase) {}

  async transaction<A>(
    tables: TableSchema<string, string, any>[],
    mode: IDBTransactionMode,
    fn: (_: Transaction) => A
  ): Promise<A> {
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

  get_table<T extends TableSchema<string, string, any>>(table: T) {
    return new Table<T["key"]["path"], T["__schema"]>(
      this.trans.objectStore(table.name)
    );
  }
}

export class Table<Key extends IDBValidKey, Schema> {
  constructor(private store: IDBObjectStore) {}

  async write(value: Schema) {
    return await lift_request(this.store.put(value));
  }

  async clear() {
    return await lift_request(this.store.clear());
  }

  async count(query?: IDBKeyRange | Key) {
    return await lift_request(this.store.count(query));
  }

  async delete(query: IDBKeyRange | Key) {
    return await lift_request(this.store.delete(query));
  }

  async get(query: IDBKeyRange | Key): Promise<Schema> {
    return await lift_request(this.store.get(query));
  }

  async try_get(query: Key): Promise<Schema | null> {
    const results = await this.get_all(query);
    if (results.length === 1) {
      return results[0];
    } else {
      return null;
    }
  }

  async get_all(query?: IDBKeyRange | Key, count?: number): Promise<Schema[]> {
    return await lift_request(this.store.getAll(query, count));
  }
}
