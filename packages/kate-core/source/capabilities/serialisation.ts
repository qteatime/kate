import { CartMeta, ContextualCapability } from "../cart";
import type {
  AnyCapabilityGrant,
  CapabilityGrant,
  CapabilityType,
} from "../data/capability";
import { unreachable } from "../utils";
import {
  AnyCapability,
  Capability,
  OpenURLs,
  RequestDeviceFiles,
} from "./definitions";

export function parse(grant: AnyCapabilityGrant) {
  switch (grant.name) {
    case "open-urls": {
      return OpenURLs.parse(grant as CapabilityGrant<"open-urls">);
    }
    case "request-device-files": {
      return RequestDeviceFiles.parse(
        grant as CapabilityGrant<"request-device-files">
      );
    }
    default:
      throw unreachable(grant.name, "grant");
  }
}

export function from_metadata(
  cart_id: string,
  capability: ContextualCapability
) {
  switch (capability.type) {
    case "open-urls": {
      return OpenURLs.from_metadata(cart_id, capability);
    }
    case "request-device-files": {
      return RequestDeviceFiles.from_metadata(cart_id, capability);
    }
    default:
      throw unreachable(capability, "capability");
  }
}

export function grants_from_cartridge(cart: CartMeta) {
  const contextual = cart.security.contextual_capabilities.map((x) =>
    from_metadata(cart.id, x.capability)
  );
  return contextual;
}

export function serialise(capability: AnyCapability) {
  return capability.serialise();
}
