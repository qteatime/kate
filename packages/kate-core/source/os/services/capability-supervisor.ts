import { AnyCapability, Capability } from "../../capabilities";
import {
  CapabilityStore,
  CapabilityType,
  GrantConfiguration,
} from "../../data/capability";
import type { KateOS } from "../os";

export class KateCapabilitySupervisor {
  constructor(readonly os: KateOS) {}

  async all_grants(cart_id: string) {
    return await CapabilityStore.transaction(
      this.os.db,
      "capability",
      "readonly",
      async (store) => store.read_all_grants(cart_id)
    );
  }

  async update_grant(cart_id: string, grant: AnyCapability) {
    return await CapabilityStore.transaction(
      this.os.db,
      "capability",
      "readwrite",
      async (store) => {
        await store.update_grant(cart_id, grant);
      }
    );
  }

  async is_allowed<T extends CapabilityType>(
    cart_id: string,
    capability: T,
    configuration: GrantConfiguration[T]
  ) {
    const grant = await CapabilityStore.transaction(
      this.os.db,
      "capability",
      "readonly",
      async (store) => {
        return store.read_grant(cart_id, capability);
      }
    );
    if (grant == null) {
      return false;
    } else {
      return grant.is_allowed(configuration);
    }
  }
}
