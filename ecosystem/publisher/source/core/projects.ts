/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { map_async } from "../deps/utils";

type ReleaseType = "prototype" | "early-access" | "beta" | "demo" | "regular" | "unofficial";
type DerivativePolicy = "not-allowed" | "personal-use" | "non-commercial-use" | "commercial-use";
type InputMethod = "buttons" | "pointer";
type ContentRating = "general" | "teen-and-up" | "mature" | "explicit" | "unknown";
type Genre =
  | "action"
  | "platformer"
  | "shooter"
  | "racing"
  | "fighting"
  | "rhythm"
  | "adventure"
  | "interactive-fiction"
  | "visual-novel"
  | "puzzle"
  | "rpg"
  | "simulation"
  | "strategy"
  | "sports"
  | "tool"
  | "other";

type Language = {
  iso_code: string;
  interface: boolean;
  audio: boolean;
  text: boolean;
};

type AccessibilityProvision =
  | "high-contrast"
  | "subtitles"
  | "image-captions"
  | "voiced-text"
  | "configurable-difficulty"
  | "skippable-content";

type Recipe = RIdentity;

type RIdentity = {
  type: "identity";
  runtime: Runtime;
};

type Runtime = WebRuntime;

type WebRuntime = {
  type: "web";
  bridges: Bridge[];
  files: Pattern[];
};

type Pattern = string;

type Bridge =
  | { type: "network-proxy" }
  | { type: "local-storage-proxy" }
  | { type: "preserve-webgl-render" }
  | { type: "capture-canvas"; selector: string }
  | { type: "pointer-input-proxy"; selector: string; hide_cursor: boolean }
  | { type: "indexeddb-proxy"; versioned: boolean }
  | { type: "renpy-web-tweaks"; version: number }
  | { type: "external-url-handler" }
  | {
      type: "keyboard-input-proxy";
      mapping: KeyboardMapping[];
      selector: "window" | "document" | string;
    };

type KateButton = KateTypes.InputKey;
type KeyboardMapping = { kate_button: KateButton; key: string };

type Release = {
  version: { major: number; minor: number };
  release_type: ReleaseType;
  date: Date;
  hash: Uint8Array;
};

type ProjectMeta = {
  title: string;
  tagline: string;
  description: string;
  genre: Genre[];
  tags: string[];
  rating: ContentRating;
  warnings: string;
  derivative_policy: DerivativePolicy;
  input_methods: InputMethod[];
  languages: Language[];
  provisions: AccessibilityProvision[];
  average_completion_seconds: number;
  average_session_seconds: number;
};

export type Project = {
  id: string;
  domain: string;
  releases: Release[];
  meta: ProjectMeta;
  recipe: Recipe;
};

export class Projects {
  async get_projects() {
    return await KateAPI.store.unversioned().ensure_bucket("projects");
  }

  async list() {
    const store = await this.get_projects();
    const projects = await store.list();
    return map_async(projects, async (meta) => {
      return await store.read<Project>(meta.key);
    });
  }

  async read(domain: string, id: string) {
    const store = await this.get_projects();
    return await store.read<Project>(this.key(domain, id));
  }

  async create(project: Project) {
    const store = await this.get_projects();
    await store.create_structured(this.project_key(project), project, { domain: project.domain });
  }

  async update(project: Project) {
    const store = await this.get_projects();
    await store.write_structured(this.project_key(project), project, { domain: project.domain });
  }

  async delete(domain: string, id: string) {
    const store = await this.get_projects();
    await store.delete(this.key(domain, id));
  }

  private key(domain: string, id: string) {
    return `${domain}/${id}`;
  }

  private project_key(project: Project) {
    return this.key(project.domain, project.id);
  }
}
