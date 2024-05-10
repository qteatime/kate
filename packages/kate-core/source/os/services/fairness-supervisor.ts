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

import { Process } from "../../kernel";
import { Deferred, unreachable } from "../../utils";
import type { KateOS } from "../os";

type Resource = "modal-dialog";

class FairLock {
  constructor(readonly resource: Resource, readonly process: Process) {}
}

export class KateFairnessSupervisor {
  private _resources = new WeakMap<Process, Map<Resource, Set<FairLock>>>();
  constructor(readonly os: KateOS) {}

  private get_locks(process: Process, resource: Resource): Set<FairLock> {
    const resources = this._resources.get(process) ?? new Map<Resource, Set<FairLock>>();
    return resources.get(resource) ?? new Set<FairLock>();
  }

  private update_resources(process: Process, resource: Resource, fn: (_: Set<FairLock>) => void) {
    if (!this._resources.has(process)) {
      this._resources.set(process, new Map());
    }
    const resources = this._resources.get(process)!;
    if (!resources.has(resource)) {
      resources.set(resource, new Set());
    }
    const locks = resources.get(resource)!;
    fn(locks);
  }

  async take(process: Process, resource: Resource) {
    if (this.is_allowed(process, resource)) {
      console.debug(`[kate:fairness] ${process.id} acquired a lock for ${resource}`);
      const lock = new FairLock(resource, process);
      this.update_resources(process, resource, (locks) => {
        locks.add(lock);
      });
      return lock;
    } else {
      console.error(`[kate:fairness] ${process.id} failed to acquire a lock for ${resource}`);
      return null;
    }
  }

  release(lock: FairLock) {
    const locks = this.get_locks(lock.process, lock.resource);
    locks.delete(lock);
    console.debug(`[kate:fairness] ${lock.process.id} released a lock for ${lock.resource}`);
  }

  async with_resource<A>(
    process: Process,
    resource: Resource,
    action: () => Promise<A>,
    on_failed: () => Error = () =>
      new Error(`Failed to take a lock to ${resource} for ${process.id}`)
  ) {
    const lock = await this.take(process, resource);
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

  private is_allowed(process: Process, resource: Resource) {
    switch (resource) {
      case "modal-dialog": {
        return (
          this.os.processes.is_foreground(process) && this.get_locks(process, resource).size === 0
        );
      }

      default:
        throw unreachable(resource);
    }
  }
}
