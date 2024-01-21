/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { CartMeta, ContextualCapability, PassiveCapability } from "../cart";
import type { AnyCapabilityGrant, CapabilityGrant, CapabilityType } from "../data/capability";
import { unreachable } from "../utils";
import {
  AnyCapability,
  Capability,
  DownloadFiles,
  InstallCartridges,
  OpenURLs,
  RequestDeviceFiles,
  ShowDialogs,
  StoreTemporaryFiles,
} from "./definitions";

export type ParsedCapability = ReturnType<typeof do_parse>;

export function parse<K extends CapabilityType>(
  grant: AnyCapabilityGrant
): Extract<ParsedCapability, { type: K }> {
  return do_parse(grant) as any;
}

function do_parse(grant: AnyCapabilityGrant) {
  switch (grant.name) {
    case "open-urls": {
      return OpenURLs.parse(grant as CapabilityGrant<"open-urls">);
    }
    case "request-device-files": {
      return RequestDeviceFiles.parse(grant as CapabilityGrant<"request-device-files">);
    }
    case "install-cartridges": {
      return InstallCartridges.parse(grant as CapabilityGrant<"install-cartridges">);
    }
    case "download-files": {
      return DownloadFiles.parse(grant as CapabilityGrant<"download-files">);
    }
    case "show-dialogs": {
      return ShowDialogs.parse(grant as CapabilityGrant<"show-dialogs">);
    }
    case "store-temporary-files": {
      return StoreTemporaryFiles.parse(grant as CapabilityGrant<"store-temporary-files">);
    }
    default:
      throw unreachable(grant.name, "grant");
  }
}

export function from_metadata(
  cart_id: string,
  capability: ContextualCapability | PassiveCapability
) {
  switch (capability.type) {
    case "open-urls": {
      return OpenURLs.from_metadata(cart_id, capability);
    }
    case "request-device-files": {
      return RequestDeviceFiles.from_metadata(cart_id, capability);
    }
    case "install-cartridges": {
      return InstallCartridges.from_metadata(cart_id, capability);
    }
    case "download-files": {
      return DownloadFiles.from_metadata(cart_id, capability);
    }
    case "show-dialogs": {
      return ShowDialogs.from_metadata(cart_id, capability);
    }
    case "store-temporary-files": {
      return StoreTemporaryFiles.from_metadata(cart_id, capability);
    }
    default:
      throw unreachable(capability, "capability");
  }
}

export function grants_from_cartridge(cart: CartMeta) {
  const contextual = cart.security.contextual_capabilities.map((x) =>
    from_metadata(cart.id, x.capability)
  );
  const passive = cart.security.passive_capabilities.map((x) =>
    from_metadata(cart.id, x.capability)
  );
  return contextual.concat(passive);
}

export function serialise(capability: AnyCapability) {
  return capability.serialise();
}
