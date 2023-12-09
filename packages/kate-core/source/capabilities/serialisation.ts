/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { CartMeta, ContextualCapability } from "../cart";
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
} from "./definitions";

export function parse(grant: AnyCapabilityGrant) {
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
    default:
      throw unreachable(grant.name, "grant");
  }
}

export function from_metadata(cart_id: string, capability: ContextualCapability) {
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
