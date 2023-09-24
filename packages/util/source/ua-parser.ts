/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { unreachable } from "./assert";

type RequestField =
  | "architecture"
  | "model"
  | "platform"
  | "platformVersion"
  | "fullVersionList"
  | "bitness"
  | "form-factor"
  | "uaFullVersion"
  | "wow64";

type DetailedUA = {
  architecture: string;
  bitness: string;
  brands: { brand: string; version: string }[];
  fullVersionList: { brand: string; version: string }[];
  mobile: boolean;
  model: string;
  platform: string;
  platformVersion: string;
  uaFullVersion: string;
  wow64: boolean;
};

declare global {
  interface Navigator {
    userAgentData: {
      brands: { brand: string; version: string }[];
      mobile: boolean;
      platform: string;
      getHighEntropyValues(fields: RequestField[]): Promise<DetailedUA>;
    };
  }
}

export type UAInfo = {
  engine: { name: string; version: string }[];
  cpu: { architecture: string; wow64?: boolean };
  os: { name: string; version?: string };
  mobile?: boolean;
};

export async function user_agent_info(): Promise<UAInfo> {
  if (navigator.userAgentData != null) {
    return try_ua_details();
  } else {
    return {
      engine: [{ name: "unknown", version: "" }],
      cpu: { architecture: "unknown" },
      os: { name: "unknown" },
    };
  }
}

async function try_ua_details(): Promise<UAInfo> {
  const ua = navigator.userAgentData;

  try {
    const details = await ua.getHighEntropyValues([
      "fullVersionList",
      "bitness",
      "architecture",
      "platform",
      "platformVersion",
      "wow64",
    ]);
    return {
      engine: normalise_brands(details.fullVersionList ?? details.brands),
      cpu: {
        architecture: normalise_architecture(
          details.architecture,
          details.bitness
        ),
        wow64: details.wow64,
      },
      os: {
        name: details.platform,
        version: normalise_version(details.platform, details.platformVersion),
      },
      mobile: details.mobile,
    };
  } catch (_) {
    return basic_ua_details();
  }
}

export function basic_ua_details() {
  const ua = navigator.userAgentData ?? {};

  return {
    engine: normalise_brands(ua.brands),
    cpu: {
      architecture: "unknown",
    },
    os: {
      name: ua.platform,
    },
    mobile: ua.mobile,
  };
}

export function normalise_brands(brands: DetailedUA["brands"]) {
  return brands
    .map((x) => ({ name: x.brand, version: x.version }))
    .filter((x) => !(/\bnot/i.test(x.name) && /brand\b/i.test(x.name)));
}

function normalise_architecture(kind: string, bitness: string) {
  switch (kind) {
    case "x86": {
      switch (bitness) {
        case "64":
          return "x64";
        case "32":
          return "x86";
        default:
          return `x86 (${bitness})`;
      }
    }

    case "arm": {
      switch (bitness) {
        case "64":
          return "ARM64";
        case "32":
          return "ARM32";
        default:
          return `ARM (${bitness})`;
      }
    }

    default:
      return `${kind} (${bitness})`;
  }
}

function normalise_version(platform: string, version: string) {
  switch (platform) {
    case "Windows": {
      const v = parse_win_version(version);
      if (v.major >= 13) {
        return "11 or newer";
      }
      if (v.major > 0) {
        return "10";
      }
      return "8.1 or older";
    }

    default:
      return version;
  }
}

function parse_win_version(version: string) {
  const [major, feature, minor] = version
    .trim()
    .split(".")
    .map((x) => Number(x));
  return { major, feature, minor };
}
