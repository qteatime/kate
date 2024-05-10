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

import { CapabilityType, GrantConfiguration } from "../../data";
import { Process } from "../../kernel";
import type { KateOS } from "../os";
import type { KateIPCServer } from "./ipc";

type Capability = {
  type: CapabilityType;
  configuration?: GrantConfiguration[CapabilityType];
};

export type Handler<A, B> = {
  type: string;
  parser: (_: any) => A;
  auth: {
    fail_silently: boolean;
    capabilities: Capability[];
  };
  handler: (
    os: KateOS,
    process: Process,
    ipc: KateIPCServer,
    payload: A,
    raw_message: unknown
  ) => Promise<B>;
};

export class EMessageFailed extends Error {
  constructor(readonly name: string, message: string) {
    super(message);
  }
}

export class WithTransfer {
  constructor(readonly value: unknown, readonly transfer: Transferable[]) {}
}

export function handler<A, B>(
  type: string,
  parser: Handler<A, B>["parser"],
  handler: Handler<A, B>["handler"]
): Handler<A, B> {
  return {
    type,
    parser: parser,
    auth: {
      fail_silently: false,
      capabilities: [],
    },
    handler: handler,
  };
}

export function auth_handler<A, B>(
  type: string,
  parser: Handler<A, B>["parser"],
  auth: {
    fail_silently?: boolean;
    capabilities: Capability[];
  },
  handler: Handler<A, B>["handler"]
): Handler<A, B> {
  return {
    type,
    parser: parser,
    auth: {
      fail_silently: auth.fail_silently ?? false,
      capabilities: auth.capabilities,
    },
    handler: handler,
  };
}
