/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateIPC } from "./channel";

export type DeveloperProfile = {
  cid: string;
  name: string;
  domain: string;
  fingerprint: string;
};

export class KateDeveloper {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async get_developer_profile(): Promise<DeveloperProfile | null> {
    return await this.#channel.call("kate:developer.get-profile", {});
  }

  async sign(profile: DeveloperProfile, message: Uint8Array): Promise<Uint8Array | null> {
    return await this.#channel.call("kate:developer.sign", { profile_cid: profile.cid, message });
  }
}
