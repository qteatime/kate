/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export {};

type SystemInfo = {
  app: {
    wrapper: string;
    version: string;
  };
  engine: {
    name: string;
    version: string;
  }[];
  memory: {
    total: number;
    free: number;
  };
  os: {
    name: string;
    platform: NodeJS.Platform;
    version: string;
    extended_version: string;
    arm64_translation: boolean;
    architecture: string;
  };
  cpu: {
    logical_cores: number;
    model: string;
    speed: number;
    endianness: "BE" | "LE";
  };
};

declare global {
  var KateNative: {
    is_native: boolean;
    get_system_information(): Promise<SystemInfo>;
    resize(size: { width: number; height: number }): Promise<void>;
    is_fullscreen(): Promise<boolean>;
    screen_resolution(): Promise<480 | 720>;
  } | null;
}
