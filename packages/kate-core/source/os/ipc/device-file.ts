/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { RuntimeEnv } from "../../kernel";
import type { KateOS } from "../os";
import { TC, make_id } from "../../utils";
import { EMessageFailed, auth_handler, handler } from "./handlers";
import { DeviceFileHandle } from "../apis";

type HandleId = string & { __handle_id: true };
export class KateDeviceFileIPC {
  private _handles = new WeakMap<
    HTMLIFrameElement,
    Map<HandleId, DeviceFileHandle>
  >();

  expose(env: RuntimeEnv, handle: DeviceFileHandle) {
    const id = make_id() as HandleId;
    const handles =
      this._handles.get(env.frame) ?? new Map<HandleId, DeviceFileHandle>();
    handles.set(id, handle);
    this._handles.set(env.frame, handles);
    return { id, path: handle.path };
  }

  async resolve(os: KateOS, env: RuntimeEnv, id: HandleId) {
    const handles =
      this._handles.get(env.frame) ?? new Map<HandleId, DeviceFileHandle>();
    const handle = handles.get(id);
    if (handle != null) {
      return handle;
    } else {
      await os.audit_supervisor.log(env.cart.id, {
        resources: ["device-fs", "error"],
        risk: "high",
        type: "kate.device-fs.file.resolve-failed",
        message: `Failed to resolve id: cartridge might be misbehaving.`,
        extra: { id },
      });
      throw new EMessageFailed("kate.device-file.no-access", `No access`);
    }
  }
}

const handle_id = TC.str as (_: any) => HandleId;

const device_ipc = new KateDeviceFileIPC();

export default [
  auth_handler(
    "kate:device-fs.request-file",
    TC.spec({
      multiple: TC.optional(false, TC.bool),
      strict: TC.optional(false, TC.bool),
      types: TC.list_of(
        TC.spec({
          type: TC.str,
          extensions: TC.list_of(TC.str),
        })
      ),
    }),
    { capabilities: [{ type: "request-device-files" }] },
    async (os, env, ipc, { multiple, strict, types }) => {
      return await os.fairness_supervisor.with_resource(
        env.cart.id,
        "modal-dialog",
        async () => {
          const handles = await os.device_file.open_file(env.cart.id, {
            multiple,
            strict,
            types: [
              {
                description: "",
                accept: Object.fromEntries(
                  types.map((x) => [x.type, x.extensions])
                ),
              },
            ],
          });
          return handles.map((x) => device_ipc.expose(env, x));
        }
      );
    }
  ),

  auth_handler(
    "kate:device-fs.request-directory",
    TC.spec({}),
    { capabilities: [{ type: "request-device-files" }] },
    async (os, env, ipc, _) => {
      return await os.fairness_supervisor.with_resource(
        env.cart.id,
        "modal-dialog",
        async () => {
          const handles = await os.device_file.open_directory(env.cart.id);
          return handles.map((x) => device_ipc.expose(env, x));
        }
      );
    }
  ),

  auth_handler(
    "kate:device-fs.read-file",
    TC.spec({ id: handle_id }),
    { capabilities: [{ type: "request-device-files" }] },
    async (os, env, ipc, { id }) => {
      const file = (await device_ipc.resolve(os, env, id)).handle;
      const data = await file.arrayBuffer();
      return new Uint8Array(data);
    }
  ),
];
