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
  SignDigitally,
  StoreTemporaryFiles,
  ViewDeveloperProfile,
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
    case "sign-digitally": {
      return SignDigitally.parse(grant as CapabilityGrant<"sign-digitally">);
    }
    case "view-developer-profile": {
      return ViewDeveloperProfile.parse(grant as CapabilityGrant<"view-developer-profile">);
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
    case "sign-digitally": {
      return SignDigitally.from_metadata(cart_id, capability);
    }
    case "view-developer-profile": {
      return ViewDeveloperProfile.from_metadata(cart_id, capability);
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
