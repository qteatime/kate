import { CapabilityType, GrantConfiguration } from "../../data";
import type { RuntimeEnv } from "../../kernel";
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
    env: RuntimeEnv,
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
