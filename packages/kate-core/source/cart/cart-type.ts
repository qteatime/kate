/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { KateButton } from "../kernel";

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
  | { type: "input-proxy"; mapping: Map<KateButton, KeyboardKey> }
  | { type: "preserve-render" }
  | { type: "capture-canvas"; selector: string }
  | { type: "pointer-input-proxy"; selector: string; hide_cursor: boolean }
  | { type: "indexeddb-proxy"; versioned: boolean }
  | { type: "renpy-web-tweaks"; version: { major: number; minor: number } }
  | { type: "external-url-handler" };

export type KeyboardKey = {
  key: string;
  code: string;
  key_code: number;
};

export type File = {
  path: string;
  mime: string;
  integrity_hash: Uint8Array;
  integrity_hash_algorithm: "SHA-256";
  data: Uint8Array;
};

export type BasicFile = Omit<File, "integrity_hash" | "integrity_hash_algorithm">;

export type ContextualCapabilityGrant = {
  capability: ContextualCapability;
  reason: string;
};

export type ContextualCapability =
  | { type: "open-urls" }
  | { type: "request-device-files" }
  | { type: "install-cartridges" }
  | { type: "download-files" }
  | { type: "show-dialogs" };

export type Security = {
  contextual_capabilities: ContextualCapabilityGrant[];
};

export type Cart = {
  id: string;
  version: string;
  release_date: Date;
  metadata: Metadata;
  runtime: Runtime;
  security: Security;
  files: File[];
};

export type CartMeta = Omit<Cart, "files">;
