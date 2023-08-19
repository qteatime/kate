import { unreachable } from "../../utils";
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
    case Cart_v4.Contextual_capability.$Tags.Request_device_files: {
      return {
        type: "request-device-files",
      };
    }
    case Cart_v4.Contextual_capability.$Tags.Install_cartridges: {
      return {
        type: "install-cartridges",
      };
    }
    case Cart_v4.Contextual_capability.$Tags.Download_files: {
      return {
        type: "download-files",
      };
    }
    default:
      throw unreachable(capability, "capability");
  }
}
