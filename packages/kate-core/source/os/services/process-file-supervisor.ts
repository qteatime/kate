/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ProcessId, SystemEvent } from "../../kernel";
import { from_bytes, make_id } from "../../utils";
import { BucketId, KateFileBucket, PartitionId } from "../apis";
import type { KateOS } from "../os";

type Bucket = {
  bucket: KateFileBucket;
  id: string;
  size: number;
  max_size: number;
};

export class KateProcessFileSupervisor {
  readonly PROCESS_MAX = 8 * 1024 * 1024 * 1024; // 8gb
  private _started = false;
  private resources = new Map<ProcessId, Map<string, Bucket>>();
  constructor(readonly os: KateOS) {}

  setup() {
    if (this._started) {
      throw new Error(`[kate:process-file-supervisor] setup() called twice`);
    }
    this.os.kernel.processes.on_system_event.listen(this.handle_process_event);
  }

  handle_process_event = (ev: SystemEvent) => {
    if (ev.type === "killed") {
      const refs = this.get_refs(ev.process.id);
      if (refs.size > 0) {
        console.debug(`[kate:process-file-supervisor] Releasing buckets held by ${ev.process.id}`);
        this.resources.delete(ev.process.id);
      }
    }
  };

  get_refs(process: ProcessId) {
    return this.resources.get(process) ?? new Map<string, Bucket>();
  }

  current_size(process: ProcessId) {
    const refs = this.get_refs(process);
    let result = 0;
    for (const ref of refs.values()) {
      result += ref.max_size;
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

  async make_temporary(process: ProcessId, size: number) {
    if (this.current_size(process) + size > this.PROCESS_MAX) {
      throw new Error(
        `[kate:process-file-supervisor] ${process} buckets would use more space than allowed.`
      );
    }

    const partition = await this.os.file_store.get_partition("temporary");
    const bucket = await partition.create(null);
    const id = make_id();
    const refs = this.get_refs(process);
    refs.set(id, { bucket: bucket, id, size: 0, max_size: size });
    this.resources.set(process, refs);
    return id;
  }

  async release(process: ProcessId, id: string) {
    const refs = this.get_refs(process);
    if (refs.has(id)) {
      refs.delete(id);
    } else {
      console.warn(`[kate:process-file-supervisor] ${process} released unknown bucket ${id}.`);
    }
    this.resources.set(process, refs);
  }

  async put_file(process: ProcessId, id: string, data: Uint8Array) {
    const ref = this.get_ref(process, id);
    if (ref.size + data.byteLength > ref.max_size) {
      throw new Error(
        `[kate:process-file-supervisor] ${process} failed to store file in ${id}: max size (${from_bytes(
          ref.max_size
        )}) for the bucket exceeded`
      );
    }
    const file = await ref.bucket.put(data);
    ref.size += data.byteLength;
    return file.id;
  }

  async append_file(process: ProcessId, id: string, file_id: string, data: Uint8Array) {
    const ref = this.get_ref(process, id);
    if (ref.size + data.byteLength > ref.max_size) {
      throw new Error(
        `[kate:process-file-supervisor] ${process} failed to store file in ${id}: max size (${from_bytes(
          ref.max_size
        )}) for the bucket exceeded`
      );
    }
    await ref.bucket.file(file_id).append(data);
    ref.size += data.byteLength;
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
  }
}
