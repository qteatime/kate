/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export type Resource = "screen-recording" | "transient-storage" | "low-storage" | "trusted-mode";

export class KateResources {
  private _attached = false;
  private _root: HTMLElement | null = null;
  readonly resources = new Map<Resource, number>();

  setup(root: HTMLElement) {
    if (this._attached) {
      throw new Error(`[kernel:resources] setup() called twice`);
    }
    this._attached = true;
    this._root = root;
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
    this.update_display();
  }

  private update_display() {
    this.assert_attached(this._root);

    this._root.textContent = "";
    for (const [resource, refs] of this.resources.entries()) {
      if (refs > 0) {
        const e = document.createElement("div");
        e.className = `kate-resource kate-resource-${resource}`;
        this._root.append(e);
      }
    }
  }

  private assert_attached(root: HTMLElement | null): asserts root is HTMLElement {
    if (this._attached == null || this._root == null) {
      throw new Error(`[kernel:resources] improper setup`);
    }
  }
}
