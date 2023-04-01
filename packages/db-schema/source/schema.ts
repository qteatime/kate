import { Database } from "./core";

export class DatabaseSchema {
  readonly tables: TableSchema<any>[] = [];
  constructor(readonly name: string, readonly version: number) {}

  async open() {
    return new Promise<{ db: Database; old_version: number }>(
      (resolve, reject) => {
        const request = indexedDB.open(this.name, this.version);
        let old_version: number = this.version;

        request.onerror = (ev) => {
          console.error(`[Kate] failed to open database`, ev);
          reject(new Error(`Unable to open database`));
        };
        request.onsuccess = (ev) => {
          resolve({
            db: new Database(request.result),
            old_version,
          });
        };
        request.onupgradeneeded = (ev) => {
          old_version = ev.oldVersion;
          const request = ev.target as IDBRequest;
          const db = request.result;
          const transaction = request.transaction!;
          for (const table of this.tables) {
            table.upgrade(db, transaction, old_version);
          }
        };
      }
    );
  }

  table1<S, K extends keyof S>(x: {
    since: number;
    name: string;
    path: K;
    auto_increment: boolean;
    deprecated_since?: number;
  }) {
    const table = new TableSchema1<S, K>(x.since, x.name, {
      path: x.path,
      auto_increment: x.auto_increment,
    });
    this.tables.push(table);
    return table;
  }

  table2<S, K1 extends keyof S, K2 extends keyof S>(x: {
    since: number;
    name: string;
    path: [K1, K2];
    auto_increment: boolean;
    deprecated_since?: number;
  }) {
    const table = new TableSchema2<S, K1, K2>(x.since, x.name, {
      path: x.path,
      auto_increment: x.auto_increment,
    });
    this.tables.push(table);
    return table;
  }
}

export abstract class TableSchema<S> {
  readonly indexes: IndexSchema[] = [];

  constructor(
    readonly version: number,
    readonly name: string,
    readonly key: { path: any; auto_increment: boolean }
  ) {}

  upgrade(db: IDBDatabase, transaction: IDBTransaction, old_version: number) {
    if (this.version > old_version) {
      db.createObjectStore(this.name, {
        keyPath: this.key.path as any,
        autoIncrement: this.key.auto_increment,
      });
    }

    for (const index of this.indexes) {
      index.upgrade(transaction, old_version);
    }
  }

  index1<K1 extends keyof S>(x: {
    since: number;
    name: string;
    path: [K1];
    unique?: boolean;
    multi_entry?: boolean;
  }) {
    const id = new IndexSchema1<S, K1>(this as any, x.since, x.name, x.path, {
      unique: x.unique ?? true,
      multi_entry: x.multi_entry ?? false,
    });
    this.indexes.push(id);
    return id;
  }

  index2<K1 extends keyof S, K2 extends keyof S>(x: {
    since: number;
    name: string;
    path: [K1, K2];
    unique?: boolean;
    multi_entry?: boolean;
  }) {
    const id = new IndexSchema2<S, K1, K2>(
      this as any,
      x.since,
      x.name,
      x.path,
      {
        unique: x.unique ?? true,
        multi_entry: x.multi_entry ?? false,
      }
    );
    this.indexes.push(id);
    return id;
  }
}

export class TableSchema1<
  Schema,
  Id extends keyof Schema
> extends TableSchema<Schema> {
  readonly __schema1!: Schema;
  readonly __k1!: Id;
  readonly __kt1!: Schema[Id];

  constructor(
    version: number,
    name: string,
    key: { path: Id; auto_increment: boolean }
  ) {
    super(version, name, key);
  }
}

export class TableSchema2<
  Schema,
  K1 extends keyof Schema,
  K2 extends keyof Schema
> extends TableSchema<Schema> {
  readonly __schema2!: Schema;
  readonly __k1!: K1;
  readonly __kt1!: Schema[K1];
  readonly __k2!: K2;
  readonly __kt2!: Schema[K2];

  constructor(
    version: number,
    name: string,
    key: { path: [K1, K2]; auto_increment: boolean }
  ) {
    super(version, name, key);
  }
}

abstract class IndexSchema {
  constructor(
    readonly table: TableSchema<any>,
    readonly version: number,
    readonly name: string,
    readonly key: any[],
    readonly options: { unique: boolean; multi_entry: boolean }
  ) {}

  upgrade(transaction: IDBTransaction, old_version: number) {
    if (this.version > old_version) {
      const store = transaction.objectStore(this.table.name);
      store.createIndex(this.name, this.key as any, {
        unique: this.options.unique,
        multiEntry: this.options.multi_entry,
      });
    }
  }
}

export class IndexSchema1<S, K1 extends keyof S> extends IndexSchema {
  readonly __schema1!: S;
  readonly __k1!: K1;
  readonly __kt1!: S[K1];

  constructor(
    table: TableSchema1<S, K1>,
    version: number,
    name: string,
    key: [K1],
    options: { unique: boolean; multi_entry: boolean }
  ) {
    super(table, version, name, key, options);
  }
}

export class IndexSchema2<
  S,
  K1 extends keyof S,
  K2 extends keyof S
> extends IndexSchema {
  readonly __schema2!: S;
  readonly __k1!: K1;
  readonly __kt1!: S[K1];
  readonly __k2!: K2;
  readonly __kt2!: S[K2];

  constructor(
    table: TableSchema2<S, K1, K2>,
    version: number,
    name: string,
    key: [K1, K2],
    options: { unique: boolean; multi_entry: boolean }
  ) {
    super(table, version, name, key, options);
  }
}
