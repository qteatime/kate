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

import { Cart_v6 } from "./v6";
import { unreachable } from "../../utils";
import { str, list, chars_in_mb, regex } from "../parser-utils";
import type {
  AccessibilityProvision,
  ContentRating,
  DerivativePolicy,
  Genre,
  InputMethod,
  Language,
  Metadata,
  ReleaseType,
} from "../cart-type";

export function parse_metadata(meta: Cart_v6.Metadata): Metadata {
  return {
    presentation: parse_presentation(meta.presentation),
    classification: parse_classification(meta.classification),
    legal: parse_legal(meta.legal),
    accessibility: parse_accessibility(meta.accessibility),
  };
}

function parse_presentation(block: Cart_v6.Meta_presentation): Metadata["presentation"] {
  return {
    title: str(block.title, 255),
    author: str(block.author, 255),
    tagline: str(block.tagline, 255),
    description: str(block.description, 10_000),
    release_type: release_kind(block["release-type"]),
    thumbnail_path: block["thumbnail-path"] ? str(block["thumbnail-path"], 1_024) : null,
    banner_path: block["banner-path"] ? str(block["banner-path"], 1_024) : null,
  };
}

function parse_classification(block: Cart_v6.Meta_classification): Metadata["classification"] {
  return {
    genre: new Set(block.genre.map((x) => genre(x))),
    tags: new Set(
      list(
        block.tags.map((x) => tag(x)),
        10
      )
    ),
    rating: content_rating(block.rating),
    content_warning: block.warnings ? str(block.warnings, 1_000) : null,
  };
}

function parse_legal(block: Cart_v6.Meta_legal): Metadata["legal"] {
  return {
    derivative_policy: derivative_policy(block["derivative-policy"]),
    licence_path: block["licence-path"] ? str(block["licence-path"], 1_024) : null,
    privacy_policy_path: block["privacy-policy-path"]
      ? str(block["privacy-policy-path"], 1_024)
      : null,
  };
}

function parse_accessibility(block: Cart_v6.Meta_accessibility): Metadata["accessibility"] {
  return {
    input_methods: new Set(block["input-methods"].map(input_method)),
    languages: list(block.languages.map(language), 255),
    provisions: new Set(block.provisions.map(accessibility_provision)),
    average_completion_seconds: block["average-completion-seconds"],
    average_session_seconds: block["average-session-seconds"],
  };
}

function release_kind(x: Cart_v6.Release_type): ReleaseType {
  switch (x["@variant"]) {
    case Cart_v6.Release_type.$Tags.Beta:
      return "beta";
    case Cart_v6.Release_type.$Tags.Demo:
      return "demo";
    case Cart_v6.Release_type.$Tags.Early_access:
      return "early-access";
    case Cart_v6.Release_type.$Tags.Regular:
      return "regular";
    case Cart_v6.Release_type.$Tags.Prototype:
      return "prototype";
    case Cart_v6.Release_type.$Tags.Unofficial:
      return "unofficial";
    default:
      throw unreachable(x);
  }
}

function genre(x: Cart_v6.Genre): Genre {
  switch (x["@variant"]) {
    case Cart_v6.Genre.$Tags.Action:
      return "action";
    case Cart_v6.Genre.$Tags.Fighting:
      return "fighting";
    case Cart_v6.Genre.$Tags.Adventure:
      return "adventure";
    case Cart_v6.Genre.$Tags.Visual_novel:
      return "visual-novel";
    case Cart_v6.Genre.$Tags.Interactive_fiction:
      return "interactive-fiction";
    case Cart_v6.Genre.$Tags.Platformer:
      return "platformer";
    case Cart_v6.Genre.$Tags.Puzzle:
      return "puzzle";
    case Cart_v6.Genre.$Tags.Racing:
      return "racing";
    case Cart_v6.Genre.$Tags.Rhythm:
      return "rhythm";
    case Cart_v6.Genre.$Tags.RPG:
      return "rpg";
    case Cart_v6.Genre.$Tags.Simulation:
      return "simulation";
    case Cart_v6.Genre.$Tags.Shooter:
      return "shooter";
    case Cart_v6.Genre.$Tags.Sports:
      return "sports";
    case Cart_v6.Genre.$Tags.Strategy:
      return "strategy";
    case Cart_v6.Genre.$Tags.Tool:
      return "tool";
    case Cart_v6.Genre.$Tags.Other:
      return "other";
    case Cart_v6.Genre.$Tags.Not_specified:
      return "not-specified";
    default:
      throw unreachable(x, "genre");
  }
}

function content_rating(x: Cart_v6.Content_rating): ContentRating {
  switch (x["@variant"]) {
    case Cart_v6.Content_rating.$Tags.General:
      return "general";
    case Cart_v6.Content_rating.$Tags.Teen_and_up:
      return "teen-and-up";
    case Cart_v6.Content_rating.$Tags.Mature:
      return "mature";
    case Cart_v6.Content_rating.$Tags.Explicit:
      return "explicit";
    case Cart_v6.Content_rating.$Tags.Unknown:
      return "unknown";
    default:
      throw unreachable(x, "content rating");
  }
}

function derivative_policy(x: Cart_v6.Derivative_policy): DerivativePolicy {
  switch (x["@variant"]) {
    case Cart_v6.Derivative_policy.$Tags.Not_allowed:
      return "not-allowed";
    case Cart_v6.Derivative_policy.$Tags.Personal_use:
      return "personal-use";
    case Cart_v6.Derivative_policy.$Tags.Non_commercial_use:
      return "non-commercial-use";
    case Cart_v6.Derivative_policy.$Tags.Commercial_use:
      return "commercial-use";
    default:
      throw unreachable(x, "derivative policy");
  }
}

function accessibility_provision(x: Cart_v6.Accessibility_provision): AccessibilityProvision {
  switch (x["@variant"]) {
    case Cart_v6.Accessibility_provision.$Tags.Configurable_difficulty:
      return "configurable-difficulty";
    case Cart_v6.Accessibility_provision.$Tags.High_contrast:
      return "high-contrast";
    case Cart_v6.Accessibility_provision.$Tags.Image_captions:
      return "image-captions";
    case Cart_v6.Accessibility_provision.$Tags.Skippable_content:
      return "skippable-content";
    case Cart_v6.Accessibility_provision.$Tags.Subtitles:
      return "subtitles";
    case Cart_v6.Accessibility_provision.$Tags.Voiced_text:
      return "voiced-text";
    default:
      throw unreachable(x);
  }
}

function input_method(x: Cart_v6.Input_method): InputMethod {
  switch (x["@variant"]) {
    case Cart_v6.Input_method.$Tags.Buttons:
      return "buttons";
    case Cart_v6.Input_method.$Tags.Pointer:
      return "pointer";
    default:
      throw unreachable(x);
  }
}

const valid_language = regex("language iso-code", /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/);

function language(x: Cart_v6.Language): Language {
  return {
    iso_code: valid_language(str(x["iso-code"], 255)),
    audio: x.audio,
    interface: x.interface,
    text: x.text,
  };
}

const tag = regex("tag", /^[a-z\-]+$/);

function assign<K extends keyof Metadata>(result: Partial<Metadata>, key: K, value: Metadata[K]) {
  if (key in result) {
    throw new Error(`Duplicated metadata block: ${key}`);
  }
  result[key] = value;
  return result;
}
