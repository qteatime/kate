import { CartMeta, ContextualCapability } from "../cart";
import type { AnyCapabilityGrant, CapabilityType } from "../data/capability";
import { AnyCapability, Capability, OpenURLs } from "./definitions";

export function parse(grant: AnyCapabilityGrant) {
  switch (grant.name) {
    case "open-urls": {
      return OpenURLs.parse(grant);
    }
  }
}

export function from_metadata(
  cart_id: string,
  capability: ContextualCapability,
  granted: boolean
) {
  switch (capability.type) {
    case "open-urls": {
      return OpenURLs.from_metadata(cart_id, capability, granted);
    }
  }
}

export function grants_from_cartridge(cart: CartMeta) {
  const contextual = cart.security.contextual_capabilities.map((x) =>
    from_metadata(cart.id, x.capability, true)
  );
  return contextual;
}

export function serialise(capability: AnyCapability) {
  return capability.serialise();
}
