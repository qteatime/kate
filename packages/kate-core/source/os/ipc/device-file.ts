import type { RuntimeEnv } from "../../kernel";
import type { KateOS } from "../os";
import { TC, make_id } from "../../utils";
import { handler } from "./handlers";
import { DeviceFileHandle } from "../apis";

async function check_access(os: KateOS, env: RuntimeEnv) {
  if (
    !(await os.capability_supervisor.is_allowed(
      env.cart.id,
      "request-device-files",
      {}
    ))
  ) {
    console.error(
      `Blocked ${env.cart.id} from requesting device files: capability not granted`
    );
    throw new Error(`No access`);
  }
}

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
    return id;
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
      throw new Error(`No access`);
    }
  }
}

const handle_id = TC.str as (_: any) => HandleId;

const device_ipc = new KateDeviceFileIPC();

export default [
  handler(
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
    async (os, env, ipc, { multiple, strict, types }) => {
      await check_access(os, env);
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
  ),

  handler(
    "kate:device-fs.request-directory",
    TC.spec({}),
    async (os, env, ipc, _) => {
      await check_access(os, env);
      const handles = await os.device_file.open_directory(env.cart.id);
      return handles.map((x) => device_ipc.expose(env, x));
    }
  ),

  handler(
    "kate:device-fs.read-file",
    TC.spec({ id: handle_id }),
    async (os, env, ipc, { id }) => {
      await check_access(os, env);
      const handle = (await device_ipc.resolve(os, env, id)).handle;
      const file = await handle.getFile();
      const data = await file.arrayBuffer();
      return new Uint8Array(data);
    }
  ),

  handler(
    "kate:device-fs.relative-path",
    TC.spec({ id: handle_id }),
    async (os, env, ipc, { id }) => {
      await check_access(os, env);
      const handle = await device_ipc.resolve(os, env, id);
      return handle.path;
    }
  ),
];
