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

import { TC } from "../../utils";
import { WithTransfer, auth_handler } from "./handlers";

export default [
  auth_handler(
    "kate:file-store.make-temporary-bucket",
    TC.spec({}),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, {}) => {
      return await os.process_file_supervisor.make_temporary(process.id);
    }
  ),

  auth_handler(
    "kate:file-store.delete-bucket",
    TC.spec({ bucket_id: TC.str }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { bucket_id }) => {
      await os.process_file_supervisor.release(process.id, bucket_id);
      return null;
    }
  ),

  auth_handler(
    "kate:file-store.put-file",
    TC.spec({ bucket_id: TC.str, data: TC.bytearray }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { bucket_id, data }) => {
      return await os.process_file_supervisor.put_file(process.id, bucket_id, data);
    }
  ),

  auth_handler(
    "kate:file-store.append-file",
    TC.spec({ bucket_id: TC.str, file_id: TC.str, data: TC.bytearray }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { bucket_id, file_id, data }) => {
      await os.process_file_supervisor.append_file(process.id, bucket_id, file_id, data);
      return null;
    }
  ),

  auth_handler(
    "kate:file-store.file-size",
    TC.spec({ bucket_id: TC.str, file_id: TC.str }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { bucket_id, file_id }) => {
      const file = await os.process_file_supervisor.read_file(process.id, bucket_id, file_id);
      return file.size;
    }
  ),

  auth_handler(
    "kate:file-store.read-file",
    TC.spec({
      bucket_id: TC.str,
      file_id: TC.str,
      offset: TC.int,
      size: TC.optional(null, TC.int),
    }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { bucket_id, file_id, offset, size }) => {
      const file = await os.process_file_supervisor.read_file(process.id, bucket_id, file_id);
      const buffer = await file
        .slice(offset, size == null ? undefined : offset + size)
        .arrayBuffer();
      return new WithTransfer(new Uint8Array(buffer), [buffer]);
    }
  ),

  auth_handler(
    "kate:file-store.delete-file",
    TC.spec({ bucket_id: TC.str, file_id: TC.str }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { bucket_id, file_id }) => {
      await os.process_file_supervisor.delete_file(process.id, bucket_id, file_id);
      return null;
    }
  ),

  auth_handler(
    "kate:file-store.create-write-stream",
    TC.spec({
      bucket_id: TC.str,
      file_id: TC.str,
      expected_size: TC.optional(undefined, TC.int),
      keep_existing_data: TC.bool,
    }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { bucket_id, file_id, keep_existing_data, expected_size }) => {
      const id = await os.process_file_supervisor.create_write_stream(
        process.id,
        bucket_id,
        file_id,
        keep_existing_data,
        expected_size
      );
      return id;
    }
  ),

  auth_handler(
    "kate:file-store.write-chunk",
    TC.spec({ writer_id: TC.str, chunk: TC.bytearray }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { writer_id, chunk }) => {
      await os.process_file_supervisor.write_chunk(process.id, writer_id, chunk);
    }
  ),

  auth_handler(
    "kate:file-store.close-write-stream",
    TC.spec({ writer_id: TC.str }),
    { capabilities: [{ type: "store-temporary-files" }] },
    async (os, process, ipc, { writer_id }) => {
      await os.process_file_supervisor.close_write_stream(process.id, writer_id);
    }
  ),
];
