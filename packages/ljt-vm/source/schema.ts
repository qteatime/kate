import { Op } from "./ast";

export class Schema {
  readonly entities = new Map<number, Entity>();

  constructor(readonly magic: Uint8Array, readonly version: number) {}

  add(entity: Entity) {
    if (this.entities.has(entity.id)) {
      throw new Error(`Duplicated entity ${entity.id}`);
    }
    this.entities.set(entity.id, entity);
  }

  resolve(id: number) {
    const entity = this.entities.get(id);
    if (entity == null) {
      throw new Error(`Undefined entity ${id}`);
    }
    return entity;
  }
}

export abstract class Entity {
  abstract id: number;
  abstract name: string;
  abstract find_version(data: unknown): unknown | null;
}

export class Union extends Entity {
  constructor(
    readonly id: number,
    readonly name: string,
    readonly versions: VersionedUnion[]
  ) {
    super();
  }

  version(v: number) {
    if (v < 0 || v >= this.versions.length) {
      throw new Error(`Invalid version for ${this.name}(${this.id}): ${v}`);
    }
    return this.versions[v];
  }

  find_version(data: { [key: string]: unknown }) {
    for (let i = this.versions.length - 1; i >= 0; --i) {
      const version = this.versions[i];
      if (version.accepts(data)) {
        return version;
      }
    }
    throw new Error(`No version of ${this.name}(${this.id}) matched`);
  }
}

export class VersionedUnion {
  constructor(
    readonly id: number,
    readonly version: number,
    readonly name: string,
    readonly variants: Variant[]
  ) {}

  variant(v: number) {
    if (v < 0 || v >= this.variants.length) {
      throw new Error(`Invalid variant for ${this.name}(${this.id}): ${v}`);
    }
    return this.variants[v];
  }

  reify(value: { [key: string]: unknown }) {
    value["@id"] = this.id;
    value["@version"] = this.version;
    value["@name"] = this.name;
    return value;
  }

  accepts(data: { [key: string]: unknown }) {
    const tag = data["@variant"];
    if (typeof tag !== "number" || tag < 0 || tag >= this.variants.length) {
      return false;
    }
    const variant = this.variants[tag];
    return variant.accepts(data);
  }
}

export class Variant {
  constructor(
    readonly name: string,
    readonly tag: number,
    readonly fields: [string, Op][]
  ) {}

  reify(value: { [key: string]: unknown }) {
    value["@variant"] = this.tag;
    value["@variant-name"] = this.name;
    return value;
  }

  accepts(data: { [key: string]: unknown }) {
    for (const [field, _] of this.fields) {
      if (!(field in data)) {
        return false;
      }
    }
    return true;
  }
}

export class Record extends Entity {
  constructor(
    readonly id: number,
    readonly name: string,
    readonly versions: VersionedRecord[]
  ) {
    super();
  }

  version(v: number) {
    if (v < 0 || v >= this.versions.length) {
      throw new Error(`Invalid version for ${this.name}(${this.id}): ${v}`);
    }
    return this.versions[v];
  }

  find_version(data: { [key: string]: unknown }) {
    for (let i = this.versions.length - 1; i >= 0; --i) {
      const version = this.versions[i];
      if (version.accepts(data)) {
        return version;
      }
    }
    throw new Error(`No version of ${this.name}(${this.id}) matched`);
  }
}

export class VersionedRecord {
  constructor(
    readonly id: number,
    readonly version: number,
    readonly name: string,
    readonly fields: [string, Op][]
  ) {}

  reify(value: { [key: string]: unknown }) {
    value["@id"] = this.id;
    value["@version"] = this.version;
    value["@name"] = this.name;
    return value;
  }

  accepts(data: { [key: string]: unknown }) {
    for (const [field, _] of this.fields) {
      if (!(field in data)) {
        return false;
      }
    }
    return true;
  }
}
