/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateButton } from "../kernel";
import type { PersistentKey } from "../os";

export type KateVersion = {
  major: number;
  minor: number;
  patch: number;
};

export type Metadata = {
  presentation: {
    title: string;
    author: string;
    tagline: string;
    description: string;
    release_type: ReleaseType;
    thumbnail_path: string | null;
    banner_path: string | null;
  };
  classification: {
    genre: Set<Genre>;
    tags: Set<Tag>;
    rating: ContentRating;
    content_warning: string | null;
  };
  legal: {
    derivative_policy: DerivativePolicy;
    licence_path: string | null;
    privacy_policy_path: string | null;
  };
  accessibility: {
    input_methods: Set<InputMethod>;
    languages: Language[];
    provisions: Set<AccessibilityProvision>;
    average_completion_seconds: number | null;
    average_session_seconds: number | null;
  };
};

type Tag = string;

export type Genre =
  | "not-specified"
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

export type ReleaseType = "prototype" | "early-access" | "beta" | "demo" | "regular" | "unofficial";

export type ContentRating = "general" | "teen-and-up" | "mature" | "explicit" | "unknown";

export type DerivativePolicy =
  | "not-allowed"
  | "personal-use"
  | "non-commercial-use"
  | "commercial-use";

export type AccessibilityProvision =
  | "high-contrast"
  | "subtitles"
  | "image-captions"
  | "voiced-text"
  | "configurable-difficulty"
  | "skippable-content";

export type Language = {
  iso_code: string;
  interface: boolean;
  audio: boolean;
  text: boolean;
};

export type InputMethod = "buttons" | "pointer";

export type Runtime = WebArchiveRuntime;

export type WebArchiveRuntime = {
  type: "web-archive";
  bridges: Bridge[];
  html_path: string;
};

export type Bridge =
  | { type: "network-proxy" }
  | { type: "local-storage-proxy" }
  | { type: "input-proxy"; mapping: Map<KateButton, KeyboardKey> } // @deprecated
  | { type: "keyboard-input-proxy-v2"; mapping: Map<KateButton, KeyboardKey>; selector: string }
  | { type: "preserve-render" }
  | { type: "capture-canvas"; selector: string }
  | { type: "pointer-input-proxy"; selector: string; hide_cursor: boolean }
  | { type: "indexeddb-proxy"; versioned: boolean }
  | { type: "renpy-web-tweaks"; version: { major: number; minor: number } }
  | { type: "external-url-handler" }
  | { type: "network-proxy-v2"; allow_sync_access: string[] };

export type KeyboardKey = {
  key: string;
  code: string;
  key_code: number;
};

export type File = {
  path: string;
  mime: string;
  integrity_hash: Uint8Array;
  integrity_hash_algorithm: "SHA-256" | "SHA-512";
  size: number;
  id: string; // a id inside a bucket
};

export type UncommitedFile = Omit<File, "id"> & {
  offset: number | null;
};

export type DataFile = Omit<File, "id"> & {
  data: Uint8Array;
};

export type BasicFile = {
  path: string;
  mime: string;
  data: Uint8Array;
};

export type ContextualCapabilityGrant = {
  capability: ContextualCapability;
  reason: string;
};

export type PassiveCapabilityGrant = {
  capability: PassiveCapability;
  reason: string;
  optional: boolean;
};

export type ContextualCapability =
  | { type: "open-urls" }
  | { type: "request-device-files" }
  | { type: "install-cartridges" }
  | { type: "download-files" }
  | { type: "show-dialogs" }
  | { type: "sign-digitally" }
  | { type: "view-developer-profile" };

export type PassiveCapability = { type: "store-temporary-files"; max_size_mb: number };

export type Security = {
  contextual_capabilities: ContextualCapabilityGrant[];
  passive_capabilities: PassiveCapabilityGrant[];
};

export type CartMeta = {
  id: string;
  version: string;
  release_date: Date;
  minimum_kate_version: KateVersion;
  metadata: Metadata;
  runtime: Runtime;
  security: Security;
};

export type DataCart = CartMeta & {
  files: UncommitedFile[];
};

export type BucketCart = CartMeta & {
  files: {
    location: PersistentKey;
    nodes: File[];
  };
};
