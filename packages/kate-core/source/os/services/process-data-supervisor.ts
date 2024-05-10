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

import type { ProcessId, SystemEvent } from "../../kernel";
import { make_id } from "../../utils";
import type { KateOS } from "../os";

type RemoteObject = {
  id: string;
  data: unknown;
  on_destroy?: (data: unknown) => void;
};

export class KateProcessDataSupervisor {
  private _started = false;
  private resources = new Map<ProcessId, Map<string, RemoteObject>>();
  constructor(readonly os: KateOS) {}

  setup() {
    if (this._started) {
      throw new Error(`[kate:process-data-supervisor] setup() called twice`);
    }
    this.os.kernel.processes.on_system_event.listen(this.handle_process_event);
  }

  private handle_process_event = async (ev: SystemEvent) => {
    if (ev.type === "killed") {
      const data = this.resources_for(ev.process.id);
      for (const [id, obj] of data) {
        obj.on_destroy?.(obj.data);
      }
      this.resources.delete(ev.process.id);
    }
  };

  private resources_for(process: ProcessId) {
    const resources = this.resources.get(process);
    if (resources == null) {
      const resources = new Map<string, RemoteObject>();
      this.resources.set(process, resources);
      return resources;
    } else {
      return resources;
    }
  }

  async put_object(process: ProcessId, data: unknown, on_destroy?: (data: unknown) => void) {
    const id = make_id();
    const resources = this.resources_for(process);
    resources.set(id, { id, data, on_destroy });
    return id;
  }

  async delete_object(process: ProcessId, id: string) {
    const resources = this.resources_for(process);
    const resource = resources.get(id);
    if (resource != null) {
      resource.on_destroy?.(resource.data);
      resources.delete(id);
    }
  }

  async read_object(process: ProcessId, id: string): Promise<unknown | null> {
    const resources = this.resources_for(process);
    return resources.get(id)?.data ?? null;
  }
}
