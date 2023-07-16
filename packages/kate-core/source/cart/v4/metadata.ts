import { Cart_v4 } from "./v4";
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

export function default_metadata(id: string): Metadata {
  return {
    presentation: {
      title: id,
      author: "",
      description: "",
      release_type: "regular",
      thumbnail_path: null,
      banner_path: null,
    },
    classification: {
      genre: new Set(),
      tags: new Set(),
      rating: "unknown",
      content_warning: null,
    },
    legal: {
      derivative_policy: "personal-use",
      licence_path: null,
      privacy_policy_path: null,
    },
    accessibility: {
      input_methods: new Set(),
      languages: [],
      provisions: new Set(),
      average_completion_seconds: null,
      average_session_seconds: null,
    },
  };
}

export function parse_metadata(cart: Cart_v4.Cartridge): Metadata {
  let result = default_metadata(cart.id);
  let collected: Partial<Metadata> = Object.create(null);

  for (const meta of cart.metadata) {
    switch (meta["@variant"]) {
      case Cart_v4.Metadata.$Tags.Presentation:
        assign(collected, "presentation", parse_presentation(meta));
        break;

      case Cart_v4.Metadata.$Tags.Classification:
        assign(collected, "classification", parse_classification(meta));
        break;

      case Cart_v4.Metadata.$Tags.Legal:
        assign(collected, "legal", parse_legal(meta));
        break;

      case Cart_v4.Metadata.$Tags.Accessibility:
        assign(collected, "accessibility", parse_accessibility(meta));
        break;

      default:
        throw unreachable(meta, "Metadata");
    }
  }

  return { ...result, ...collected };
}

function parse_presentation(
  block: Cart_v4.Metadata.Presentation
): Metadata["presentation"] {
  return {
    title: str(block.title, 255),
    author: str(block.author, 255),
    description: str(block.description, 10_000),
    release_type: release_kind(block["release-type"]),
    thumbnail_path: block["thumbnail-path"]
      ? str(block["thumbnail-path"], 1_024)
      : null,
    banner_path: block["banner-path"] ? str(block["banner-path"], 1_024) : null,
  };
}

function parse_classification(
  block: Cart_v4.Metadata.Classification
): Metadata["classification"] {
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

function parse_legal(block: Cart_v4.Metadata.Legal): Metadata["legal"] {
  return {
    derivative_policy: derivative_policy(block["derivative-policy"]),
    licence_path: block["licence-path"]
      ? str(block["licence-path"], 1_024)
      : null,
    privacy_policy_path: block["privacy-policy-path"]
      ? str(block["privacy-policy-path"], 1_024)
      : null,
  };
}

function parse_accessibility(
  block: Cart_v4.Metadata.Accessibility
): Metadata["accessibility"] {
  return {
    input_methods: new Set(block["input-methods"].map(input_method)),
    languages: list(block.languages.map(language), 255),
    provisions: new Set(block.provisions.map(accessibility_provision)),
    average_completion_seconds: block["average-completion-seconds"],
    average_session_seconds: block["average-session-seconds"],
  };
}

function release_kind(x: Cart_v4.Release_type): ReleaseType {
  switch (x["@variant"]) {
    case Cart_v4.Release_type.$Tags.Beta:
      return "beta";
    case Cart_v4.Release_type.$Tags.Demo:
      return "demo";
    case Cart_v4.Release_type.$Tags.Early_access:
      return "early-access";
    case Cart_v4.Release_type.$Tags.Regular:
      return "regular";
    case Cart_v4.Release_type.$Tags.Prototype:
      return "prototype";
    default:
      throw unreachable(x);
  }
}

function genre(x: Cart_v4.Genre): Genre {
  switch (x["@variant"]) {
    case Cart_v4.Genre.$Tags.Action:
      return "action";
    case Cart_v4.Genre.$Tags.Fighting:
      return "fighting";
    case Cart_v4.Genre.$Tags.Adventure:
      return "adventure";
    case Cart_v4.Genre.$Tags.Visual_novel:
      return "visual-novel";
    case Cart_v4.Genre.$Tags.Interactive_fiction:
      return "interactive-fiction";
    case Cart_v4.Genre.$Tags.Platformer:
      return "platformer";
    case Cart_v4.Genre.$Tags.Puzzle:
      return "puzzle";
    case Cart_v4.Genre.$Tags.Racing:
      return "racing";
    case Cart_v4.Genre.$Tags.Rhythm:
      return "rhythm";
    case Cart_v4.Genre.$Tags.RPG:
      return "rpg";
    case Cart_v4.Genre.$Tags.Simulation:
      return "simulation";
    case Cart_v4.Genre.$Tags.Shooter:
      return "shooter";
    case Cart_v4.Genre.$Tags.Sports:
      return "sports";
    case Cart_v4.Genre.$Tags.Strategy:
      return "strategy";
    case Cart_v4.Genre.$Tags.Tool:
      return "tool";
    case Cart_v4.Genre.$Tags.Other:
      return "other";
    case Cart_v4.Genre.$Tags.Not_specified:
      return "not-specified";
    default:
      throw unreachable(x, "genre");
  }
}

function content_rating(x: Cart_v4.Content_rating): ContentRating {
  switch (x["@variant"]) {
    case Cart_v4.Content_rating.$Tags.General:
      return "general";
    case Cart_v4.Content_rating.$Tags.Teen_and_up:
      return "teen-and-up";
    case Cart_v4.Content_rating.$Tags.Mature:
      return "mature";
    case Cart_v4.Content_rating.$Tags.Explicit:
      return "explicit";
    case Cart_v4.Content_rating.$Tags.Unknown:
      return "unknown";
    default:
      throw unreachable(x, "content rating");
  }
}

function derivative_policy(x: Cart_v4.Derivative_policy): DerivativePolicy {
  switch (x["@variant"]) {
    case Cart_v4.Derivative_policy.$Tags.Not_allowed:
      return "not-allowed";
    case Cart_v4.Derivative_policy.$Tags.Personal_use:
      return "personal-use";
    case Cart_v4.Derivative_policy.$Tags.Non_commercial_use:
      return "non-commercial-use";
    case Cart_v4.Derivative_policy.$Tags.Commercial_use:
      return "commercial-use";
    default:
      throw unreachable(x, "derivative policy");
  }
}

function accessibility_provision(
  x: Cart_v4.Accessibility_provision
): AccessibilityProvision {
  switch (x["@variant"]) {
    case Cart_v4.Accessibility_provision.$Tags.Configurable_difficulty:
      return "configurable-difficulty";
    case Cart_v4.Accessibility_provision.$Tags.High_contrast:
      return "high-contrast";
    case Cart_v4.Accessibility_provision.$Tags.Image_captions:
      return "image-captions";
    case Cart_v4.Accessibility_provision.$Tags.Skippable_content:
      return "skippable-content";
    case Cart_v4.Accessibility_provision.$Tags.Subtitles:
      return "subtitles";
    case Cart_v4.Accessibility_provision.$Tags.Voiced_text:
      return "voiced-text";
    default:
      throw unreachable(x);
  }
}

function input_method(x: Cart_v4.Input_method): InputMethod {
  switch (x["@variant"]) {
    case Cart_v4.Input_method.$Tags.Buttons:
      return "buttons";
    case Cart_v4.Input_method.$Tags.Pointer:
      return "pointer";
    default:
      throw unreachable(x);
  }
}

const valid_language = regex(
  "language iso-code",
  /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/
);

function language(x: Cart_v4.Language): Language {
  return {
    iso_code: valid_language(str(x["iso-code"], 255)),
    audio: x.audio,
    interface: x.interface,
    text: x.text,
  };
}

const tag = regex("tag", /^[a-z\-]+$/);

function assign<K extends keyof Metadata>(
  result: Partial<Metadata>,
  key: K,
  value: Metadata[K]
) {
  if (key in result) {
    throw new Error(`Duplicated metadata block: ${key}`);
  }
  result[key] = value;
  return result;
}
