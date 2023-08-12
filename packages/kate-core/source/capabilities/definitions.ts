import { ContextualCapability } from "../cart";
import type {
  CapabilityGrant,
  CapabilityType,
  GrantConfiguration,
  GrantType,
  SerialisedCapability,
} from "../data/capability";
import type { RiskCategory } from "./risk";

export type AnyCapability = Capability<CapabilityType>;
export type AnySwitchCapability = SwitchCapability<CapabilityType>;

export abstract class Capability<T extends CapabilityType> {
  abstract type: T;
  abstract title: string;
  abstract description: string;
  abstract grant_type: GrantType["type"];
  abstract grant_configuration: GrantType["value"];
  abstract cart_id: string;
  abstract serialise(): SerialisedCapability;
  abstract is_allowed(configuration: GrantConfiguration[T]): boolean;
  abstract risk_category(): RiskCategory;
}

export abstract class SwitchCapability<
  T extends CapabilityType
> extends Capability<T> {
  readonly grant_type = "switch";
  abstract grant_configuration: boolean;
  abstract update(grant: boolean): void;

  is_allowed(configuration: {}): boolean {
    return this.grant_configuration;
  }

  serialise(): SerialisedCapability {
    return {
      name: this.type,
      cart_id: this.cart_id,
      granted: { type: "switch", value: this.grant_configuration },
    };
  }
}

export class OpenURLs extends SwitchCapability<"open-urls"> {
  readonly type = "open-urls";
  readonly title = "Navigate to external URLs";
  readonly description = `
    Allow the cartridge to request opening a URL on your device's browser.
  `;

  get grant_configuration() {
    return this._grant_configuration;
  }

  constructor(readonly cart_id: string, private _grant_configuration: boolean) {
    super();
  }

  static parse(grant: CapabilityGrant<OpenURLs["type"]>) {
    if (grant.name !== "open-urls" || grant.granted.type !== "switch") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new OpenURLs(grant.cart_id, grant.granted.value);
  }

  static from_metadata(cart_id: string, capability: ContextualCapability) {
    if (capability.type !== "open-urls") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new OpenURLs(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  risk_category(): RiskCategory {
    return this.grant_configuration ? "low" : "none";
  }
}

export class RequestDeviceFiles extends SwitchCapability<"request-device-files"> {
  readonly type = "request-device-files";
  readonly title = "Request access to device files";
  readonly description = `
    Allow the cartridge to request access to files and directories on your device.
  `;

  get grant_configuration() {
    return this._grant_configuration;
  }

  constructor(readonly cart_id: string, private _grant_configuration: boolean) {
    super();
  }

  static parse(grant: CapabilityGrant<RequestDeviceFiles["type"]>) {
    if (
      grant.name !== "request-device-files" ||
      grant.granted.type !== "switch"
    ) {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new RequestDeviceFiles(grant.cart_id, grant.granted.value);
  }

  static from_metadata(cart_id: string, capability: ContextualCapability) {
    if (capability.type !== "request-device-files") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new RequestDeviceFiles(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  risk_category(): RiskCategory {
    return this.grant_configuration ? "high" : "none";
  }
}
