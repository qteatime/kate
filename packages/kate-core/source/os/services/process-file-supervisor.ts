/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ProcessId, SystemEvent } from "../../kernel";
import { from_bytes, gb, make_id } from "../../utils";
import { BucketId, KateFileBucket, PartitionId } from "../apis";
import type { KateOS } from "../os";

type Bucket = {
  bucket: KateFileBucket;
  id: string;
  size: number;
};

type Writer = {
  bucket_id: string;
  written_size: number;
  expected_size: number | null;
  writer: FileSystemWritableFileStream;
};

export class KateProcessFileSupervisor {
  readonly PROCESS_MAX = gb(32);
  private _started = false;
  private _in_use = false;
  private resources = new Map<ProcessId, Map<string, Bucket>>();
  private writers = new Map<ProcessId, Map<string, Writer>>();
  constructor(readonly os: KateOS) {}

  setup() {
    if (this._started) {
      throw new Error(`[kate:process-file-supervisor] setup() called twice`);
    }
    this.os.kernel.processes.on_system_event.listen(this.handle_process_event);
  }

  private handle_process_event = async (ev: SystemEvent) => {
    if (ev.type === "killed") {
      const refs = this.get_refs(ev.process.id);
      if (refs.size > 0) {
        console.debug(`[kate:process-file-supervisor] Releasing buckets held by ${ev.process.id}`);
        const partition = await this.os.file_store.get_partition("temporary");
        for (const ref of refs.values()) {
          partition.release(ref.bucket);
        }
        this.resources.delete(ev.process.id);
        this.writers.delete(ev.process.id);
        this.update_resource_band();
      }
    }
  };

  private update_resource_band() {
    if (this.resources.size > 0 && !this._in_use) {
      this.os.kernel.console.resources.take("temporary-file");
      this._in_use = true;
    } else if (this.resources.size === 0 && this._in_use) {
      this.os.kernel.console.resources.release("temporary-file");
      this._in_use = false;
    }
  }

  async available_max() {
    const storage_size = await this.os.storage_manager.storage_summary();
    if (storage_size.quota == null || storage_size.usage == null) {
      return this.PROCESS_MAX;
    } else {
      return Math.min((storage_size.quota - storage_size.usage) * 0.6, this.PROCESS_MAX);
    }
  }

  async available_max_for_process(process: ProcessId) {
    const grant = await this.os.capability_supervisor.try_get_grant(
      process,
      "store-temporary-files"
    );
    const available = await this.available_max();
    if (grant == null) {
      return 0;
    } else {
      return Math.min(available, grant.grant_configuration.max_size_bytes);
    }
  }

  get_refs(process: ProcessId) {
    return this.resources.get(process) ?? new Map<string, Bucket>();
  }

  get_writers(process: ProcessId) {
    return this.writers.get(process) ?? new Map<string, Writer>();
  }

  current_size(process: ProcessId) {
    const refs = this.get_refs(process);
    let result = 0;
    for (const ref of refs.values()) {
      result += ref.size;
    }
    return result;
  }

  get_ref(process: ProcessId, id: string) {
    const refs = this.get_refs(process);
    const ref = refs.get(id);
    if (ref == null) {
      throw new Error(
        `[kate:process-file-supervisor] Invalid bucket reference ${id} for process ${process}`
      );
    }
    return ref;
  }

  get_writer(process: ProcessId, id: string) {
    const refs = this.get_writers(process);
    const ref = refs.get(id);
    if (ref == null) {
      throw new Error(
        `[kate:process-file-supervisor] Invalid writer stream reference ${id} for process ${process}`
      );
    }
    return ref;
  }

  async assert_fits(process: ProcessId, size: number) {
    const max_storage = await this.available_max_for_process(process);
    if (this.current_size(process) + size > max_storage) {
      throw new Error(
        `[kate:process-file-supervisor] ${process} buckets would use more space than allowed.`
      );
    }
  }

  async make_temporary(process: ProcessId) {
    const partition = await this.os.file_store.get_partition("temporary");
    const bucket = await partition.create(null);
    const id = make_id();
    const refs = this.get_refs(process);
    refs.set(id, { bucket: bucket, id, size: 0 });
    this.resources.set(process, refs);
    console.debug(
      `[kate:process-file-supervisor] Allocated bucket ${bucket.id} (ref: ${id}) for ${process}`
    );
    this.update_resource_band();
    return id;
  }

  async release(process: ProcessId, id: string) {
    const refs = this.get_refs(process);
    const ref = refs.get(id);
    if (ref != null) {
      ref.bucket.partition.release(ref.bucket);
      refs.delete(id);
    } else {
      console.warn(`[kate:process-file-supervisor] ${process} released unknown bucket ${id}.`);
    }
    if (refs.size === 0) {
      this.resources.delete(process);
    } else {
      this.resources.set(process, refs);
    }
    console.debug(`[kate:process-file-supervisor] Released bucket ${id} for ${process}`);
    this.update_resource_band();
  }

  async put_file(process: ProcessId, id: string, data: Uint8Array) {
    const ref = this.get_ref(process, id);
    await this.assert_fits(process, data.byteLength);
    const file = await ref.bucket.put(data);
    ref.size += data.byteLength;
    console.debug(
      `[kate:process-file-supervisor] Wrote file ${id}/${file.id} (${from_bytes(
        data.byteLength
      )}) for ${process}`
    );
    return file.id;
  }

  async create_write_stream(
    process: ProcessId,
    id: string,
    file_id: string,
    keep_existing_data: boolean,
    expected_size?: number
  ) {
    const ref = this.get_ref(process, id);
    const handle = await ref.bucket.file(file_id).get_handle();
    if (expected_size != null) {
      await this.assert_fits(process, expected_size);
    }
    const writer = await handle.createWritable({ keepExistingData: keep_existing_data });
    const writers = this.get_writers(process);
    if (writers.has(file_id)) {
      throw new Error(
        `[kate:process-file-supervisor] ${process} cannot write to file ${file_id} because there's already a write-lock on the file.`
      );
    }
    writers.set(file_id, {
      bucket_id: id,
      expected_size: expected_size ?? null,
      written_size: 0,
      writer,
    });
    this.writers.set(process, writers);
    console.debug(
      `[kate:process-file-supervisor] Created file stream ${id}/${file_id} (${
        expected_size == null ? "(unknown size)" : from_bytes(expected_size)
      }) for ${process}`
    );
    return { bucket: id, file: file_id };
  }

  async write_chunk(process: ProcessId, writer_id: string, chunk: Uint8Array) {
    const writer = this.get_writer(process, writer_id);
    const ref = this.get_ref(process, writer.bucket_id);
    await this.assert_fits(process, chunk.byteLength);
    if (
      writer.expected_size != null &&
      writer.written_size + chunk.byteLength > writer.expected_size
    ) {
      console.warn(
        `[kate:process-file-supervisor] ${process} wrote more bytes than expected to file ${writer_id} (written: ${from_bytes(
          writer.written_size + chunk.byteLength
        )}, expected: ${writer.expected_size})`
      );
    }
    ref.size += chunk.byteLength;
    writer.written_size += chunk.byteLength;
    console.debug(
      `[kate:process-file-supervisor] Wrote chunk to ${writer_id} (${from_bytes(
        chunk.byteLength
      )}) for ${process}`
    );
    await writer.writer.write(chunk);
  }

  async close_write_stream(process: ProcessId, writer_id: string) {
    const writer = this.get_writer(process, writer_id);
    await writer.writer.close();
    this.get_writers(process).delete(writer_id);
    console.debug(`[kate:process-file-supervisor] Committed ${writer_id} for ${process}`);
  }

  async append_file(process: ProcessId, id: string, file_id: string, data: Uint8Array) {
    const ref = this.get_ref(process, id);
    this.assert_fits(process, data.byteLength);
    await ref.bucket.file(file_id).append(data);
    ref.size += data.byteLength;
    console.debug(
      `[kate:process-file-supervisor] Appended ${from_bytes(
        data.byteLength
      )} in ${id}/${file_id} for ${process}`
    );
  }

  async read_file(process: ProcessId, id: string, file_id: string) {
    const ref = this.get_ref(process, id);
    const file = await ref.bucket.file(file_id).read();
    return file;
  }

  async delete_file(process: ProcessId, id: string, file_id: string) {
    const ref = this.get_ref(process, id);
    const file = ref.bucket.file(file_id);
    const handle = await file.read();
    ref.size -= handle.size;
    await file.delete();
    console.debug(`[kate:process-file-supervisor] Deleted ${id}/${file_id} for ${process}`);
  }
}
