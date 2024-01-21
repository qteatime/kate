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
  max_size: number;
};

export class KateProcessFileSupervisor {
  readonly PROCESS_MAX = gb(32);
  private _started = false;
  private _in_use = false;
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
    const max_storage = await this.available_max_for_process(process);
    if (this.current_size(process) + size > max_storage) {
      throw new Error(
        `[kate:process-file-supervisor] ${process} buckets would use more space than allowed.`
      );
    }
    if (!this._in_use) {
      this.os.kernel.console.resources.take("temporary-file");
      this._in_use = true;
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
    if (refs.size === 0) {
      this.resources.delete(process);
    } else {
      this.resources.set(process, refs);
    }
    if (this._in_use && this.resources.size === 0) {
      this.os.kernel.console.resources.release("temporary-file");
      this._in_use = false;
    }
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
