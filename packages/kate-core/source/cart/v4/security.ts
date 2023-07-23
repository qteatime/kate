import {
  ContextualCapability,
  ContextualCapabilityGrant,
  Security,
} from "../cart-type";
import { Cart_v4 } from "./v4";

export function parse_security(cart: Cart_v4.Cartridge): Security {
  return {
    contextual_capabilities: cart.security.capabilities.map(parse_capability),
  };
}

function parse_capability(
  capability: Cart_v4.Capability.Contextual
): ContextualCapabilityGrant {
  return {
    reason: capability.reason,
    capability: parse_contextual_capability(capability.capability),
  };
}

function parse_contextual_capability(
  capability: Cart_v4.Contextual_capability
): ContextualCapability {
  switch (capability["@variant"]) {
    case Cart_v4.Contextual_capability.$Tags.Open_URLs: {
      return {
        type: "open-urls",
      };
    }
  }
}
