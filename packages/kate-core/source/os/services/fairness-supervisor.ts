/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Deferred, unreachable } from "../../utils";
import type { KateOS } from "../os";

type Resource = "modal-dialog";
type ProcessId = string;

class FairLock {
  constructor(readonly resource: Resource, readonly process_id: string) {}
}

export class KateFairnessSupervisor {
  private _resources = new Map<ProcessId, Map<Resource, Set<FairLock>>>();
  constructor(readonly os: KateOS) {}

  private get_locks(process_id: ProcessId, resource: Resource): Set<FairLock> {
    const resources =
      this._resources.get(process_id) ?? new Map<Resource, Set<FairLock>>();
    return resources.get(resource) ?? new Set<FairLock>();
  }

  private update_resources(
    process_id: ProcessId,
    resource: Resource,
    fn: (_: Set<FairLock>) => void
  ) {
    if (!this._resources.has(process_id)) {
      this._resources.set(process_id, new Map());
    }
    const resources = this._resources.get(process_id)!;
    if (!resources.has(resource)) {
      resources.set(resource, new Set());
    }
    const locks = resources.get(resource)!;
    fn(locks);
  }

  async take(process_id: ProcessId, resource: Resource) {
    if (this.is_allowed(process_id, resource)) {
      console.debug(
        `[kate:fairness] ${process_id} acquired a lock for ${resource}`
      );
      const lock = new FairLock(resource, process_id);
      this.update_resources(process_id, resource, (locks) => {
        locks.add(lock);
      });
      return lock;
    } else {
      console.error(
        `[kate:fairness] ${process_id} failed to acquire a lock for ${resource}`
      );
      return null;
    }
  }

  release(lock: FairLock) {
    const locks = this.get_locks(lock.process_id, lock.resource);
    locks.delete(lock);
    console.debug(
      `[kate:fairness] ${lock.process_id} released a lock for ${lock.resource}`
    );
  }

  async with_resource<A>(
    process_id: ProcessId,
    resource: Resource,
    action: () => Promise<A>,
    on_failed: () => Error = () =>
      new Error(`Failed to take a lock to ${resource} for ${process_id}`)
  ) {
    const lock = await this.take(process_id, resource);
    if (lock == null) {
      throw on_failed();
    }

    try {
      const result = await action();
      return result;
    } finally {
      this.release(lock);
    }
  }

  private is_allowed(process_id: ProcessId, resource: Resource) {
    switch (resource) {
      case "modal-dialog": {
        return (
          this.os.processes.is_foreground(process_id) &&
          this.get_locks(process_id, resource).size === 0
        );
      }

      default:
        throw unreachable(resource);
    }
  }
}
