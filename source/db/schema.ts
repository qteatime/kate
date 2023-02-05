import { Database } from "./db";

export class DBError_UnableToOpen extends Error {
  constructor(readonly db: DatabaseSchema) {
    super(`Unable to open ${db.name}`);
  }
}

export class DatabaseSchema {
  readonly tables: TableSchema<string, string, any>[] = [];
  constructor(readonly name: string, readonly version: number) {}

  table<T extends { [key: string]: any }>(
    since: number,
    name: string,
    options: { path: string; auto_increment: boolean },
    indexes: IndexSchema[]
  ) {
    const table = new TableSchema<typeof name, typeof options["path"], T>(
      since,
      name,
      options,
      indexes
    );
    this.tables.push(table);
    return table;
  }

  async open() {
    return new Promise<Database>((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);
      request.onerror = (ev) => {
        reject(new DBError_UnableToOpen(this));
      };
      request.onsuccess = (ev) => {
        resolve(new Database(request.result));
      };
      request.onupgradeneeded = (ev) => {
        const old_version = ev.oldVersion;
        const db = (ev.target as any).result as IDBDatabase;
        for (const table of this.tables) {
          if (table.version > old_version) {
            table.upgrade(db);
          }
        }
      };
    });
  }
}

export class TableSchema<
  K extends string,
  Id extends string,
  Schema extends { [key: string]: any }
> {
  __schema!: Schema;

  constructor(
    readonly version: number,
    readonly name: K,
    readonly key: { path: Id; auto_increment: boolean },
    readonly indexes: IndexSchema[]
  ) {}

  get key_path() {
    return this.key.path;
  }

  upgrade(db: IDBDatabase) {
    const store = db.createObjectStore(this.name, {
      keyPath: this.key.path,
      autoIncrement: this.key.auto_increment,
    });
    for (const index of this.indexes) {
      index.upgrade(store);
    }
  }
}

export class IndexSchema {
  constructor(
    readonly name: string,
    readonly key_path: string,
    readonly options: { unique: boolean }
  ) {}

  upgrade(store: IDBObjectStore) {
    store.createIndex(this.name, this.key_path, {
      unique: this.options.unique,
    });
  }
}
