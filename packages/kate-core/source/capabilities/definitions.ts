/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { ContextualCapability, PassiveCapability } from "../cart";
import type {
  CapabilityGrant,
  CapabilityType,
  GrantConfiguration,
  GrantType,
  SerialisedCapability,
} from "../data/capability";
import { from_bytes, gb, mb } from "../utils";
import { combine_risk, type RiskCategory } from "./risk";

export type AnyCapability = Capability<CapabilityType>;
export type AnySwitchCapability = SwitchCapability<CapabilityType>;
export type AnyStorageSpaceCapability = StorageSpaceCapability<CapabilityType>;

export type CategorySummary = {
  category: string;
  description: string;
  combine(that: AnyCapability): AnyCapability;
};

export abstract class Capability<T extends CapabilityType> {
  abstract type: T;
  abstract cart_id: string;
  // Presentation metadata
  abstract title: string;
  abstract description: string;
  abstract base_risk: RiskCategory;
  abstract risk_category(): RiskCategory;
  // Grant configuration
  abstract grant_type: GrantType["type"];
  abstract grant_configuration: GrantType["value"];
  abstract serialise(): SerialisedCapability;
  // Testing
  abstract is_allowed(configuration: GrantConfiguration[T]): boolean;
  get is_contextual() {
    return this.summary == null;
  }
  // Summaries
  abstract summary: null | CategorySummary;
}

export abstract class SwitchCapability<T extends CapabilityType> extends Capability<T> {
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

export abstract class StorageSpaceCapability<T extends CapabilityType> extends Capability<T> {
  readonly grant_type = "storage-space";
  abstract grant_configuration: { max_size_bytes: number };
  abstract update(grant: { max_size_bytes: number }): void;
  abstract options: { label: string; bytes: number }[];

  is_allowed(configuration: { max_size_bytes?: number }): boolean {
    return configuration.max_size_bytes == null
      ? this.grant_configuration.max_size_bytes > 0
      : this.grant_configuration.max_size_bytes >= configuration.max_size_bytes;
  }

  serialise(): SerialisedCapability {
    return {
      name: this.type,
      cart_id: this.cart_id,
      granted: { type: "storage-space", value: this.grant_configuration },
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

  static from_metadata(
    cart_id: string,
    capability: ContextualCapability & { type: OpenURLs["type"] }
  ) {
    if (capability.type !== "open-urls") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new OpenURLs(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  base_risk = "low" as const;
  risk_category(): RiskCategory {
    return this.grant_configuration ? "low" : "none";
  }

  summary = null;
}

export class RequestDeviceFiles extends SwitchCapability<"request-device-files"> {
  readonly type = "request-device-files";
  readonly title = "Ask to access your files";
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
    if (grant.name !== "request-device-files" || grant.granted.type !== "switch") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new RequestDeviceFiles(grant.cart_id, grant.granted.value);
  }

  static from_metadata(
    cart_id: string,
    capability: ContextualCapability & { type: RequestDeviceFiles["type"] }
  ) {
    if (capability.type !== "request-device-files") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new RequestDeviceFiles(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  base_risk = "high" as const;
  risk_category(): RiskCategory {
    return this.grant_configuration ? "high" : "none";
  }

  summary = null;
}

export class InstallCartridges extends SwitchCapability<"install-cartridges"> {
  readonly type = "install-cartridges";
  readonly title = "Ask to install cartridges";
  readonly description = `
    Allow the cartridge to request installation of other cartridges.
  `;

  get grant_configuration() {
    return this._grant_configuration;
  }

  constructor(readonly cart_id: string, private _grant_configuration: boolean) {
    super();
  }

  static parse(grant: CapabilityGrant<InstallCartridges["type"]>) {
    if (grant.name !== "install-cartridges" || grant.granted.type !== "switch") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new InstallCartridges(grant.cart_id, grant.granted.value);
  }

  static from_metadata(
    cart_id: string,
    capability: ContextualCapability & { type: InstallCartridges["type"] }
  ) {
    if (capability.type !== "install-cartridges") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new InstallCartridges(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  base_risk = "critical" as const;
  risk_category(): RiskCategory {
    return this.grant_configuration ? "critical" : "none";
  }

  summary = null;
}

export class DownloadFiles extends SwitchCapability<"download-files"> {
  readonly type = "download-files";
  readonly title = "Ask to download files";
  readonly description = `
    Allow the cartridge to ask to save files to your device's file system.
  `;

  get grant_configuration() {
    return this._grant_configuration;
  }

  constructor(readonly cart_id: string, private _grant_configuration: boolean) {
    super();
  }

  static parse(grant: CapabilityGrant<DownloadFiles["type"]>) {
    if (grant.name !== "download-files" || grant.granted.type !== "switch") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new DownloadFiles(grant.cart_id, grant.granted.value);
  }

  static from_metadata(
    cart_id: string,
    capability: ContextualCapability & { type: DownloadFiles["type"] }
  ) {
    if (capability.type !== "download-files") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new DownloadFiles(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  base_risk = "critical" as const;
  risk_category(): RiskCategory {
    return this.grant_configuration ? "critical" : "none";
  }

  summary = null;
}

export class ShowDialogs extends SwitchCapability<"show-dialogs"> {
  readonly type = "show-dialogs";
  readonly title = "Show modal dialogs";
  readonly description = `
    Allow the cartridge to show modal dialogs.
  `;

  get grant_configuration() {
    return this._grant_configuration;
  }

  constructor(readonly cart_id: string, private _grant_configuration: boolean) {
    super();
  }

  static parse(grant: CapabilityGrant<ShowDialogs["type"]>) {
    if (grant.name !== "show-dialogs" || grant.granted.type !== "switch") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new ShowDialogs(grant.cart_id, grant.granted.value);
  }

  static from_metadata(
    cart_id: string,
    capability: ContextualCapability & { type: ShowDialogs["type"] }
  ) {
    if (capability.type !== "show-dialogs") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new ShowDialogs(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  base_risk = "low" as const;
  risk_category(): RiskCategory {
    return this.grant_configuration ? "low" : "none";
  }

  summary = null;
}

export class StoreTemporaryFiles extends StorageSpaceCapability<"store-temporary-files"> {
  readonly type = "store-temporary-files";
  readonly title = "Store temporary files";
  readonly description = `
    Allow the cartridge to save temporary files in your device's file system.
    The files will be deleted once the cartridge is closed.
  `;
  readonly options = [
    {
      label: "Disabled",
      bytes: 0,
    },
  ].concat(
    [gb(1), gb(4), gb(8), gb(32), gb(256)].map((x) => ({ label: from_bytes(x, 0), bytes: x }))
  );

  get grant_configuration() {
    return { max_size_bytes: this._grant_configuration.max_size_bytes };
  }

  constructor(readonly cart_id: string, private _grant_configuration: { max_size_bytes: number }) {
    super();
  }

  static parse(grant: CapabilityGrant<StoreTemporaryFiles["type"]>) {
    if (grant.name !== "store-temporary-files" || grant.granted.type !== "storage-space") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new StoreTemporaryFiles(grant.cart_id, grant.granted.value);
  }

  static from_metadata(
    cart_id: string,
    capability: PassiveCapability & { type: StoreTemporaryFiles["type"] }
  ) {
    if (capability.type !== "store-temporary-files") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new StoreTemporaryFiles(cart_id, {
      max_size_bytes: mb(capability.max_size_mb),
    });
  }

  update(grant: { max_size_bytes: number }): void {
    this._grant_configuration = grant;
  }

  base_risk = "low" as const;
  risk_category(): RiskCategory {
    return this.grant_configuration ? "low" : "none";
  }

  summary = {
    category: "file-access",
    description: "access temporary files",
    combine(that: AnyCapability) {
      return that;
    },
  };
}

export class SignDigitally extends SwitchCapability<"sign-digitally"> {
  readonly type = "sign-digitally";
  readonly title = "Ask to sign data";
  readonly description = `
    Allow the cartridge to ask to use your digital signing keys to sign
    any piece of data.
  `;

  get grant_configuration() {
    return this._grant_configuration;
  }

  constructor(readonly cart_id: string, private _grant_configuration: boolean) {
    super();
  }

  static parse(grant: CapabilityGrant<SignDigitally["type"]>) {
    if (grant.name !== "sign-digitally" || grant.granted.type !== "switch") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new SignDigitally(grant.cart_id, grant.granted.value);
  }

  static from_metadata(
    cart_id: string,
    capability: ContextualCapability & { type: SignDigitally["type"] }
  ) {
    if (capability.type !== "sign-digitally") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new SignDigitally(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  base_risk = "medium" as const;
  risk_category(): RiskCategory {
    return this.grant_configuration ? "medium" : "none";
  }

  summary = null;
}

export class ViewDeveloperProfile extends SwitchCapability<"view-developer-profile"> {
  readonly type = "view-developer-profile";
  readonly title = "Ask for your developer profile";
  readonly description = `
    Allows the cartridge to read non-sensitive data in your developer profile
    (e.g.: name, domain, and public key fingerprint).
  `;

  get grant_configuration() {
    return this._grant_configuration;
  }

  constructor(readonly cart_id: string, private _grant_configuration: boolean) {
    super();
  }

  static parse(grant: CapabilityGrant<ViewDeveloperProfile["type"]>) {
    if (grant.name !== "view-developer-profile" || grant.granted.type !== "switch") {
      throw new Error(`Unexpected capability: ${grant.name}`);
    }
    return new ViewDeveloperProfile(grant.cart_id, grant.granted.value);
  }

  static from_metadata(
    cart_id: string,
    capability: ContextualCapability & { type: ViewDeveloperProfile["type"] }
  ) {
    if (capability.type !== "view-developer-profile") {
      throw new Error(`Unexpected capability: ${capability.type}`);
    }
    return new ViewDeveloperProfile(cart_id, true);
  }

  update(grant: boolean): void {
    this._grant_configuration = grant;
  }

  base_risk = "medium" as const;
  risk_category(): RiskCategory {
    return this.grant_configuration ? "medium" : "none";
  }

  summary = null;
}
