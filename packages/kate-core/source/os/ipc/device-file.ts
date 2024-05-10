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

import type { KateOS } from "../os";
import { TC, make_id } from "../../utils";
import { EMessageFailed, WithTransfer, auth_handler, handler } from "./handlers";
import { DeviceFileHandle } from "../apis";
import * as UI from "../ui";
import { Process } from "../../kernel";

type HandleId = string & { __handle_id: true };
export class KateDeviceFileIPC {
  private _handles = new WeakMap<HTMLIFrameElement, Map<HandleId, DeviceFileHandle>>();

  expose(process: Process, handle: DeviceFileHandle) {
    const id = make_id() as HandleId;
    const handles = this._handles.get(process.frame) ?? new Map<HandleId, DeviceFileHandle>();
    handles.set(id, handle);
    this._handles.set(process.frame, handles);
    return { id, path: handle.path };
  }

  async resolve(os: KateOS, process: Process, id: HandleId) {
    const handles = this._handles.get(process.frame) ?? new Map<HandleId, DeviceFileHandle>();
    const handle = handles.get(id);
    if (handle != null) {
      return handle;
    } else {
      await os.audit_supervisor.log(process.cartridge.id, {
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

async function assert_allowed(
  os: KateOS,
  cart_id: string,
  type: "files" | "directories",
  ok: string
) {
  const allowed = await os.dialog.confirm("kate:device-file", {
    title: `Allow access to your ${type}?`,
    message: UI.stack([
      UI.paragraph([
        UI.strong([UI.mono_text([cart_id])]),
        ` wants read-only access to one of your ${type}. `,
        `It will be able to read what you select until you close the cartridge.`,
      ]),
    ]),
    cancel: "Cancel",
    ok: ok,
    dangerous: true,
  });
  if (!allowed) {
    console.error(`[kate:device-file] Denied access to ${type} to ${cart_id}`);
    throw new EMessageFailed("kate.device-file.not-allowed", `Not allowed`);
  }
}

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
    async (os, process, ipc, { multiple, strict, types }) => {
      return await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
        await assert_allowed(os, process.cartridge.id, "files", "Select file");
        const handles = await os.device_file.open_file(process.cartridge.id, {
          multiple,
          strict,
          types: [
            {
              description: "",
              accept: Object.fromEntries(types.map((x) => [x.type, x.extensions])),
            },
          ],
        });
        return handles.map((x) => device_ipc.expose(process, x));
      });
    }
  ),

  auth_handler(
    "kate:device-fs.request-directory",
    TC.spec({}),
    { capabilities: [{ type: "request-device-files" }] },
    async (os, process, ipc, _) => {
      return await os.fairness_supervisor.with_resource(process, "modal-dialog", async () => {
        await assert_allowed(os, process.cartridge.id, "directories", "Select directory");
        const handles = await os.device_file.open_directory(process.cartridge.id);
        return handles.map((x) => device_ipc.expose(process, x));
      });
    }
  ),

  auth_handler(
    "kate:device-fs.read-file",
    TC.spec({ id: handle_id }),
    { capabilities: [{ type: "request-device-files" }] },
    async (os, env, ipc, { id }) => {
      const file = (await device_ipc.resolve(os, env, id)).handle;
      const data = await file.arrayBuffer();
      return new WithTransfer(new Uint8Array(data), [data]);
    }
  ),
];
