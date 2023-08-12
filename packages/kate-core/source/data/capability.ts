import { Database, Transaction } from "../db-schema";
import { kate } from "./db";
import * as Capability from "../capabilities";
import { Cart, CartMeta } from "../cart";

export type GrantType = { type: "switch"; value: boolean };

export type GrantConfiguration = {
  "open-urls": {};
  "request-device-files": {};
};

export type CapabilityType = "open-urls" | "request-device-files";

export type SerialisedCapability = Pick<
  AnyCapabilityGrant,
  "cart_id" | "name" | "granted"
>;

export type CapabilityGrant<T extends CapabilityType> = {
  cart_id: string;
  name: T;
  granted: GrantType;
  updated_at: Date | null;
};

export type AnyCapabilityGrant = CapabilityGrant<CapabilityType>;

export const capability_grant = kate.table2<
  AnyCapabilityGrant,
  "cart_id",
  "name"
>({
  since: 12,
  name: "capability_grants",
  path: ["cart_id", "name"],
  auto_increment: false,
});

export const idx_capabilities_by_cart = capability_grant.index1({
  since: 13,
  name: "by_cart_v2",
  path: "cart_id",
  multi_entry: false,
  unique: false,
});

type TransactionKind = "capability";

export class CapabilityStore {
  constructor(readonly transaction: Transaction) {}

  static transaction<A>(
    db: Database,
    kind: TransactionKind,
    mode: IDBTransactionMode,
    fn: (store: CapabilityStore) => Promise<A>
  ) {
    return db.transaction(
      CapabilityStore.tables_by_kind(kind),
      mode,
      async (txn) => {
        return await fn(new CapabilityStore(txn));
      }
    );
  }

  get grants() {
    return this.transaction.get_table2(capability_grant);
  }

  get grants_by_cartridge() {
    return this.transaction.get_index1(idx_capabilities_by_cart);
  }

  static tables = [capability_grant];

  static tables_by_kind(kind: TransactionKind) {
    switch (kind) {
      case "capability": {
        return [capability_grant];
      }
    }
  }

  async read_all_grants(cart_id: string) {
    const grants = await this.grants_by_cartridge.get_all(cart_id);
    return grants.map(Capability.parse);
  }

  async read_grant(cart_id: string, name: CapabilityType) {
    const grant = await this.grants.try_get([cart_id, name]);
    if (grant == null) {
      return null;
    } else {
      return Capability.parse(grant);
    }
  }

  async update_grant(cart_id: string, capability: Capability.AnyCapability) {
    if (capability.cart_id !== cart_id) {
      throw new Error(
        `Inconsistent cartridge for capability ${capability.type}`
      );
    }

    const changes = capability.serialise();
    const new_value: AnyCapabilityGrant = {
      cart_id: cart_id,
      name: changes.name,
      granted: changes.granted,
      updated_at: new Date(),
    };
    await this.grants.put(new_value);
  }

  async initialise_grants(cart_id: string, grants: Capability.AnyCapability[]) {
    if (grants.some((x) => x.cart_id !== cart_id)) {
      throw new Error(`Some capabilities does not match cartridge`);
    }
    for (const grant of grants) {
      const serialised = grant.serialise();
      const old_grant = await this.grants.try_get([cart_id, grant.type]);
      if (old_grant == null) {
        await this.grants.add({
          cart_id: cart_id,
          name: serialised.name,
          granted: serialised.granted,
          updated_at: new Date(),
        });
      }
    }
  }
}
