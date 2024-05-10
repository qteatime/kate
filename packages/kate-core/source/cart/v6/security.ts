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

import { unreachable } from "../../utils";
import {
  ContextualCapability,
  ContextualCapabilityGrant,
  PassiveCapability,
  PassiveCapabilityGrant,
  Security,
} from "../cart-type";
import { Cart_v6 } from "./v6";

export function parse_security(metadata: Cart_v6.Metadata): Security {
  const { contextual, passive } = metadata.security.capabilities.reduce(parse_capability, {
    contextual: [],
    passive: [],
  });
  return {
    contextual_capabilities: contextual,
    passive_capabilities: passive,
  };
}

function parse_capability(
  acc: { contextual: ContextualCapabilityGrant[]; passive: PassiveCapabilityGrant[] },
  x: Cart_v6.Capability
) {
  const t = Cart_v6.Capability;
  switch (x["@variant"]) {
    case t.$Tags.Contextual:
      acc.contextual.push(parse_contextual_capability(x));
      return acc;

    case t.$Tags.Passive:
      acc.passive.push(parse_passive_capability(x));
      return acc;

    default:
      throw unreachable(x);
  }
}

function parse_passive_capability(capability: Cart_v6.Capability.Passive): PassiveCapabilityGrant {
  return {
    reason: capability.reason,
    capability: do_parse_passive_capability(capability.capability),
    optional: capability.optional,
  };
}

function do_parse_passive_capability(capability: Cart_v6.Passive_capability): PassiveCapability {
  const t = Cart_v6.Passive_capability;
  switch (capability["@variant"]) {
    case t.$Tags.Store_temporary_files: {
      return {
        type: "store-temporary-files",
        max_size_mb: capability["max-size-mb"],
      };
    }

    // default:
    //   throw unreachable(capability);
  }
}

function parse_contextual_capability(
  capability: Cart_v6.Capability.Contextual
): ContextualCapabilityGrant {
  return {
    reason: capability.reason,
    capability: do_parse_contextual_capability(capability.capability),
  };
}

function do_parse_contextual_capability(
  capability: Cart_v6.Contextual_capability
): ContextualCapability {
  switch (capability["@variant"]) {
    case Cart_v6.Contextual_capability.$Tags.Open_URLs: {
      return {
        type: "open-urls",
      };
    }
    case Cart_v6.Contextual_capability.$Tags.Request_device_files: {
      return {
        type: "request-device-files",
      };
    }
    case Cart_v6.Contextual_capability.$Tags.Install_cartridges: {
      return {
        type: "install-cartridges",
      };
    }
    case Cart_v6.Contextual_capability.$Tags.Download_files: {
      return {
        type: "download-files",
      };
    }
    case Cart_v6.Contextual_capability.$Tags.Show_dialogs: {
      return {
        type: "show-dialogs",
      };
    }
    case Cart_v6.Contextual_capability.$Tags.Sign_digitally: {
      return {
        type: "sign-digitally",
      };
    }
    case Cart_v6.Contextual_capability.$Tags.View_developer_profile: {
      return {
        type: "view-developer-profile",
      };
    }
    default:
      throw unreachable(capability, "capability");
  }
}
