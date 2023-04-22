import type { RuntimeEnv } from "../../kernel";
import type { KateOS } from "../os";
import type { KateIPCServer } from "./ipc";

export type Handler<A, B> = {
  type: string;
  parser: (_: any) => A;
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
) {
  return {
    type,
    parser: parser,
    handler: handler,
  };
}
