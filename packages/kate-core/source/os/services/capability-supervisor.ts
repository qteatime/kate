/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

import { AnyCapability, Capability } from "../../capabilities";
import { CapabilityStore, CapabilityType, GrantConfiguration } from "../../data/capability";
import { OptionalRec } from "../../utils";
import type { KateOS } from "../os";

export class KateCapabilitySupervisor {
  constructor(readonly os: KateOS) {}

  async all_grants(cart_id: string) {
    return await CapabilityStore.transaction(this.os.db, "capability", "readonly", async (store) =>
      store.read_all_grants(cart_id)
    );
  }

  async try_get_grant<K extends CapabilityType>(cart_id: string, capability: K) {
    return await CapabilityStore.transaction(
      this.os.db,
      "capability",
      "readonly",
      async (store) => {
        return store.read_grant(cart_id, capability);
      }
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
    configuration: OptionalRec<GrantConfiguration[T]>
  ) {
    const grant = await CapabilityStore.transaction(
      this.os.db,
      "capability",
      "readonly",
      async (store) => {
        return store.read_grant<T>(cart_id, capability);
      }
    );
    if (grant == null) {
      return false;
    } else {
      return grant.is_allowed(configuration);
    }
  }
}
