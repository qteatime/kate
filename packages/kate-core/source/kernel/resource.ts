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

export type Resource =
  | "screen-recording"
  | "transient-storage"
  | "low-storage"
  | "gc"
  | "temporary-file";

export type RunningProcessMeta = {
  application_id: string;
  trusted: boolean;
};

export class KateResources {
  readonly resources = new Map<Resource, number>();
  private running_process: RunningProcessMeta | null = null;

  constructor(private _root: HTMLElement) {
    if (_root == null) {
      throw new Error(`[kernel:resources] invalid HTML tree`);
    }
  }

  set_running_process(process: RunningProcessMeta | null) {
    console.debug(
      `[kernel:resource] changed running process to ${process?.application_id ?? null} (trusted: ${
        process?.trusted ?? null
      })`
    );
    this.running_process = process;
    this.update_display();
  }

  take(resource: Resource) {
    const refs = this.resources.get(resource) ?? 0;
    this.resources.set(resource, refs + 1);
    this.update_display();
  }

  is_taken(resource: Resource) {
    return (this.resources.get(resource) ?? 0) > 0;
  }

  release(resource: Resource) {
    const refs = this.resources.get(resource) ?? 0;
    this.resources.set(resource, Math.max(0, refs - 1));
    if (refs - 1 < 0) {
      console.warn(
        `[kernel:resource] releasing more ${resource} references than acquired ones.`,
        new Error().stack
      );
    }
    this.update_display();
  }

  private update_display() {
    this._root.textContent = "";
    for (const [resource, refs] of this.resources.entries()) {
      if (refs > 0) {
        const e = document.createElement("div");
        e.className = `kate-resource kate-resource-${resource}`;
        this._root.append(e);
      }
    }
    if (this.running_process != null) {
      const e = document.createElement("div");
      e.className = "kate-resource kate-current-process-indicator";
      e.title = this.running_process.application_id;
      e.toggleAttribute("data-trusted", this.running_process.trusted);
      this._root.append(e);
    }
  }
}
