/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { TC } from "../../utils";
import { handler } from "./handlers";

export const public_repr = {};

export default [
  handler(
    "kate:file-store.make-temporary-bucket",
    TC.spec({ size: TC.int }),
    async (os, process, ipc, { size }) => {
      return await os.process_file_supervisor.make_temporary(process.id, size);
    }
  ),

  handler(
    "kate.file-store.delete-bucket",
    TC.spec({ bucket_id: TC.str }),
    async (os, process, ipc, { bucket_id }) => {
      await os.process_file_supervisor.release(process.id, bucket_id);
      return null;
    }
  ),

  handler(
    "kate:file-store.put-file",
    TC.spec({ bucket_id: TC.str, data: TC.bytearray }),
    async (os, process, ipc, { bucket_id, data }) => {
      return await os.process_file_supervisor.put_file(process.id, bucket_id, data);
    }
  ),

  handler(
    "kate:file-store.append-file",
    TC.spec({ bucket_id: TC.str, file_id: TC.str, data: TC.bytearray }),
    async (os, process, ipc, { bucket_id, file_id, data }) => {
      await os.process_file_supervisor.append_file(process.id, bucket_id, file_id, data);
      return null;
    }
  ),

  handler(
    "kate:file-store.file-size",
    TC.spec({ bucket_id: TC.str, file_id: TC.str }),
    async (os, process, ipc, { bucket_id, file_id }) => {
      const file = await os.process_file_supervisor.read_file(process.id, bucket_id, file_id);
      return file.size;
    }
  ),

  handler(
    "kate:file-store.read-file",
    TC.spec({
      bucket_id: TC.str,
      file_id: TC.str,
      offset: TC.int,
      size: TC.optional(null, TC.int),
    }),
    async (os, process, ipc, { bucket_id, file_id, offset, size }) => {
      const file = await os.process_file_supervisor.read_file(process.id, bucket_id, file_id);
      return new Uint8Array(
        await file.slice(offset, size == null ? undefined : offset + size).arrayBuffer()
      );
    }
  ),

  handler(
    "kate:file-store.delete-file",
    TC.spec({ bucket_id: TC.str, file_id: TC.str }),
    async (os, process, ipc, { bucket_id, file_id }) => {
      await os.process_file_supervisor.delete_file(process.id, bucket_id, file_id);
      return null;
    }
  ),
];
