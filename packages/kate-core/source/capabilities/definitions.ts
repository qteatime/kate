import { ContextualCapability } from "../cart";
import type {
  CapabilityGrant,
  CapabilityType,
  GrantConfiguration,
  SerialisedCapability,
} from "../data/capability";

export type AnyCapability = Capability<CapabilityType>;

export abstract class Capability<T extends CapabilityType> {
  abstract type: T;
  abstract cart_id: string;
  abstract serialise(): SerialisedCapability;
  abstract is_allowed(configuration: GrantConfiguration[T]): boolean;
}

export class OpenURLs extends Capability<"open-urls"> {
  readonly type = "open-urls";

  constructor(readonly cart_id: string, readonly granted: boolean) {
    super();
  }

  static parse(grant: CapabilityGrant<OpenURLs["type"]>) {
    if (grant.name !== "open-urls" || grant.granted.type !== "switch") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new OpenURLs(grant.cart_id, grant.granted.value);
  }

  static from_metadata(
    cart_id: string,
    capability: ContextualCapability,
    granted: boolean
  ) {
    if (capability.type !== "open-urls") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new OpenURLs(cart_id, granted);
  }

  is_allowed(configuration: GrantConfiguration["open-urls"]): boolean {
    return this.granted;
  }

  serialise(): SerialisedCapability {
    return {
      name: this.type,
      cart_id: this.cart_id,
      granted: { type: "switch", value: this.granted },
    };
  }
}
