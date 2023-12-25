/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Database } from "./core";

export class DatabaseSchema {
  readonly tables: TableSchema<any>[] = [];
  readonly data_migrations: DataMigration[] = [];
  constructor(readonly name: string, readonly version: number) {}

  async open(override_name?: string) {
    const name = override_name ?? this.name;

    return new Promise<{ db: Database; old_version: number }>((resolve, reject) => {
      const request = indexedDB.open(name, this.version);
      let old_version: number = this.version;

      request.onerror = (ev) => {
        console.error(`[Kate] failed to open database`, request.error);
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
    });
  }

  needs_data_migration(old_version: number) {
    return this.data_migrations.some((x) => x.is_needed(old_version, this.version));
  }

  async run_data_migration(
    old_version: number,
    db: Database,
    args: unknown[],
    progress: (migration: DataMigration, current: number, total: number) => void
  ) {
    const migrations = this.data_migrations.filter((x) => x.is_needed(old_version, this.version));
    let current = 1;
    for (const migration of migrations) {
      progress(migration, current, migrations.length);
      await migration.run(old_version, db, args);
      current += 1;
    }
  }

  data_migration(x: {
    id: string;
    since: number;
    description: string;
    process: (_: Database, ...args: unknown[]) => Promise<void>;
  }) {
    this.data_migrations.push(new DataMigration(x.id, x.since, x.description, x.process));
  }

  table1<S, K extends keyof S>(x: {
    since: number;
    name: string;
    path: K;
    auto_increment: boolean;
    deprecated_since?: number;
    deleted_since?: number;
  }) {
    const table = new TableSchema1<S, K>(
      x.since,
      x.name,
      {
        path: x.path,
        auto_increment: x.auto_increment,
      },
      x.deleted_since
    );
    this.tables.push(table);
    return table;
  }

  table2<S, K1 extends keyof S, K2 extends keyof S>(x: {
    since: number;
    name: string;
    path: [K1, K2];
    auto_increment: boolean;
    deprecated_since?: number;
    deleted_since?: number;
  }) {
    const table = new TableSchema2<S, K1, K2>(
      x.since,
      x.name,
      {
        path: x.path,
        auto_increment: x.auto_increment,
      },
      x.deleted_since
    );
    this.tables.push(table);
    return table;
  }

  table3<S, K1 extends keyof S, K2 extends keyof S, K3 extends keyof S>(x: {
    since: number;
    name: string;
    path: [K1, K2, K3];
    auto_increment: boolean;
    deprecated_since?: number;
    deleted_since?: number;
  }) {
    const table = new TableSchema3<S, K1, K2, K3>(
      x.since,
      x.name,
      {
        path: x.path,
        auto_increment: x.auto_increment,
      },
      x.deleted_since
    );
    this.tables.push(table);
    return table;
  }
}

export abstract class TableSchema<S> {
  readonly indexes: IndexSchema[] = [];

  constructor(
    readonly version: number,
    readonly name: string,
    readonly key: { path: any; auto_increment: boolean },
    readonly deleted_since?: number
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

    if (this.deleted_since != null && old_version >= this.deleted_since) {
      if (db.objectStoreNames.contains(this.name)) {
        db.deleteObjectStore(this.name);
      }
    }
  }

  index1<K1 extends keyof S>(x: {
    since: number;
    name: string;
    path: K1;
    unique?: boolean;
    multi_entry?: boolean;
    deprecated_since?: number;
    deleted_since?: number;
  }) {
    const id = new IndexSchema1<S, K1>(
      this as any,
      x.since,
      x.name,
      x.path,
      {
        unique: x.unique ?? true,
        multi_entry: x.multi_entry ?? false,
      },
      x.deleted_since
    );
    this.indexes.push(id);
    return id;
  }

  index2<K1 extends keyof S, K2 extends keyof S>(x: {
    since: number;
    name: string;
    path: [K1, K2];
    unique?: boolean;
    multi_entry?: boolean;
    deprecated_since?: number;
    deleted_since?: number;
  }) {
    const id = new IndexSchema2<S, K1, K2>(
      this as any,
      x.since,
      x.name,
      x.path,
      {
        unique: x.unique ?? true,
        multi_entry: x.multi_entry ?? false,
      },
      x.deleted_since
    );
    this.indexes.push(id);
    return id;
  }
}

export class TableSchema1<Schema, Id extends keyof Schema> extends TableSchema<Schema> {
  readonly __schema1!: Schema;
  readonly __k1!: Id;
  readonly __kt1!: Schema[Id];

  constructor(
    version: number,
    name: string,
    key: { path: Id; auto_increment: boolean },
    deleted_since?: number
  ) {
    super(version, name, key, deleted_since);
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
    key: { path: [K1, K2]; auto_increment: boolean },
    deleted_since?: number
  ) {
    super(version, name, key, deleted_since);
  }
}

export class TableSchema3<
  Schema,
  K1 extends keyof Schema,
  K2 extends keyof Schema,
  K3 extends keyof Schema
> extends TableSchema<Schema> {
  readonly __schema3!: Schema;
  readonly __k1!: K1;
  readonly __kt1!: Schema[K1];
  readonly __k2!: K2;
  readonly __kt2!: Schema[K2];
  readonly __k3!: K3;
  readonly __kt3!: Schema[K3];

  constructor(
    version: number,
    name: string,
    key: { path: [K1, K2, K3]; auto_increment: boolean },
    deleted_since?: number
  ) {
    super(version, name, key, deleted_since);
  }
}

abstract class IndexSchema {
  constructor(
    readonly table: TableSchema<any>,
    readonly version: number,
    readonly name: string,
    readonly key: any | any[],
    readonly options: { unique: boolean; multi_entry: boolean },
    readonly deleted_since?: number
  ) {}

  upgrade(transaction: IDBTransaction, old_version: number) {
    if (this.version > old_version) {
      const store = transaction.objectStore(this.table.name);
      store.createIndex(this.name, this.key, {
        unique: this.options.unique,
        multiEntry: this.options.multi_entry,
      });
    }
    if (this.deleted_since != null && old_version >= this.deleted_since) {
      const store = transaction.objectStore(this.table.name);
      if (store.indexNames.contains(this.name)) {
        store.deleteIndex(this.name);
      }
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
    key: K1,
    options: { unique: boolean; multi_entry: boolean },
    deleted_since?: number
  ) {
    super(table, version, name, key, options, deleted_since);
  }
}

export class IndexSchema2<S, K1 extends keyof S, K2 extends keyof S> extends IndexSchema {
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
    options: { unique: boolean; multi_entry: boolean },
    deleted_since?: number
  ) {
    super(table, version, name, key, options, deleted_since);
  }
}

export class DataMigration {
  constructor(
    readonly id: string,
    readonly version: number,
    readonly description: string,
    readonly process: (_: Database, ...args: unknown[]) => Promise<void>
  ) {}

  private done(): string[] {
    return JSON.parse(localStorage["kate:migrations:done"] ?? "[]");
  }

  private mark_done() {
    const done = new Set(this.done());
    done.add(this.id);
    localStorage["kate:migrations:done"] = JSON.stringify([...done]);
  }

  is_needed(old_version: number, new_version: number) {
    const processed = this.done();
    if (processed.includes(this.id)) {
      return false;
    }

    return old_version <= this.version && this.version <= new_version;
  }

  async run(old_version: number, db: Database, args: unknown[]) {
    if (this.is_needed(old_version, db.version)) {
      await this.process(db, ...args);
      this.mark_done();
    }
  }
}
