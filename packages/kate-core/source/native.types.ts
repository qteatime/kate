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
    screen_resolution(): Promise<480 | 720 | 960>;
  } | null;
}
