import { Cart_v3 } from "./v3";
import { unreachable } from "../../utils";
import { str, list, chars_in_mb, regex } from "../parser-utils";

export type Metadata = {
  id: string;
  version_id: string;
  game: {
    author: string;
    title: string;
    description: string;
    genre: Set<Genre>;
    tags: Set<Tag>;
  };
  release: {
    kind: ReleaseType;
    date: Date;
    version: Version;
    legal_notices: string;
    licence_name: string;
    allow_derivative: boolean;
    allow_commercial: boolean;
  };
  rating: {
    rating: ContentRating;
    content_warning: string | null;
  };
  play_style: {
    input_methods: Set<InputMethod>;
    local_multiplayer: PlayerRange | null;
    online_multiplayer: PlayerRange | null;
    languages: Language[];
    accessibility: Set<Accessibility>;
    average_duration: Duration;
  };
};

type Genre =
  | "not-specified"
  | "action"
  | "fighting"
  | "interactive-fiction"
  | "platformer"
  | "puzzle"
  | "racing"
  | "rhythm"
  | "rpg"
  | "simulation"
  | "shooter"
  | "sports"
  | "strategy"
  | "tool"
  | "other";

type Version = { major: number; minor: number };

type ReleaseType = "prototype" | "early-access" | "beta" | "demo" | "full";

type ContentRating =
  | "general"
  | "teen-and-up"
  | "mature"
  | "explicit"
  | "unknown";

type Duration =
  | "seconds"
  | "few-minutes"
  | "half-hour"
  | "one-hour"
  | "few-hours"
  | "several-hours"
  | "unknown";

type InputMethod = "kate-buttons" | "touch";

type PlayerRange = { minimum: number; maximum: number };

type Language = {
  iso_code: string;
  interface: boolean;
  audio: boolean;
  text: boolean;
};

type Accessibility =
  | "high-contrast"
  | "subtitles"
  | "image-captions"
  | "voiced-text"
  | "configurable-difficulty"
  | "skippable-content";

type Tag = string;

export function version_string(meta: Metadata) {
  return `${meta.release.version.major}.${meta.release.version.minor}`;
}

export function parse_metadata(cart: Cart_v3.Cartridge): Metadata {
  const version = {
    major: Math.floor(cart.metadata.release.version.major),
    minor: Math.floor(cart.metadata.release.version.minor),
  };
  return {
    id: str(valid_id(cart.id), 255),
    version_id: `${version.major}.${version.minor}`,
    game: {
      title: str(cart.metadata.title.title, 255),
      author: str(cart.metadata.title.author, 255),
      description: str(cart.metadata.title.description, 10_000),
      genre: new Set(cart.metadata.title.genre.map((x) => genre(x))),
      tags: new Set(
        list(
          cart.metadata.title.tags.map((x) => tag(x)),
          10
        )
      ),
    },
    release: {
      kind: release_kind(cart.metadata.release["release-type"]),
      date: date(cart.metadata.release["release-date"]),
      version: version,
      licence_name: str(cart.metadata.release["licence-name"], 255),
      allow_commercial: cart.metadata.release["allow-commercial"],
      allow_derivative: cart.metadata.release["allow-derivative"],
      legal_notices: str(
        cart.metadata.release["legal-notices"],
        chars_in_mb(5)
      ),
    },
    rating: {
      rating: content_rating(cart.metadata.rating.rating),
      content_warning: cart.metadata.rating.warnings
        ? str(cart.metadata.rating.warnings, 1_000)
        : null,
    },
    play_style: {
      accessibility: new Set(
        cart.metadata.play.accessibility.map(accessibility)
      ),
      average_duration: duration(cart.metadata.play["average-duration"]),
      input_methods: new Set(
        cart.metadata.play["input-methods"].map(input_method)
      ),
      languages: list(cart.metadata.play.languages.map(language), 255),
      local_multiplayer: player_range(cart.metadata.play["local-multiplayer"]),
      online_multiplayer: player_range(
        cart.metadata.play["online-multiplayer"]
      ),
    },
  };
}

function genre(x: Cart_v3.Genre): Genre {
  switch (x["@variant"]) {
    case Cart_v3.Genre.$Tags.Action:
      return "action";
    case Cart_v3.Genre.$Tags.Figthing:
      return "fighting";
    case Cart_v3.Genre.$Tags.Interactive_fiction:
      return "interactive-fiction";
    case Cart_v3.Genre.$Tags.Platformer:
      return "platformer";
    case Cart_v3.Genre.$Tags.Puzzle:
      return "puzzle";
    case Cart_v3.Genre.$Tags.Racing:
      return "racing";
    case Cart_v3.Genre.$Tags.Rhythm:
      return "rhythm";
    case Cart_v3.Genre.$Tags.RPG:
      return "rpg";
    case Cart_v3.Genre.$Tags.Simulation:
      return "simulation";
    case Cart_v3.Genre.$Tags.Shooter:
      return "shooter";
    case Cart_v3.Genre.$Tags.Sports:
      return "sports";
    case Cart_v3.Genre.$Tags.Strategy:
      return "strategy";
    case Cart_v3.Genre.$Tags.Tool:
      return "tool";
    case Cart_v3.Genre.$Tags.Other:
      return "other";
    case Cart_v3.Genre.$Tags.Not_specified:
      return "not-specified";
    default:
      throw unreachable(x);
  }
}

function release_kind(x: Cart_v3.Release_type): ReleaseType {
  switch (x["@variant"]) {
    case Cart_v3.Release_type.$Tags.Beta:
      return "beta";
    case Cart_v3.Release_type.$Tags.Demo:
      return "demo";
    case Cart_v3.Release_type.$Tags.Early_access:
      return "early-access";
    case Cart_v3.Release_type.$Tags.Full:
      return "full";
    case Cart_v3.Release_type.$Tags.Prototype:
      return "prototype";
    default:
      throw unreachable(x);
  }
}

function content_rating(x: Cart_v3.Content_rating) {
  switch (x["@variant"]) {
    case Cart_v3.Content_rating.$Tags.General:
      return "general";
    case Cart_v3.Content_rating.$Tags.Teen_and_up:
      return "teen-and-up";
    case Cart_v3.Content_rating.$Tags.Mature:
      return "mature";
    case Cart_v3.Content_rating.$Tags.Explicit:
      return "explicit";
    case Cart_v3.Content_rating.$Tags.Unknown:
      return "unknown";
    default:
      throw unreachable(x);
  }
}

function accessibility(x: Cart_v3.Accessibility) {
  switch (x["@variant"]) {
    case Cart_v3.Accessibility.$Tags.Configurable_difficulty:
      return "configurable-difficulty";
    case Cart_v3.Accessibility.$Tags.High_contrast:
      return "high-contrast";
    case Cart_v3.Accessibility.$Tags.Image_captions:
      return "image-captions";
    case Cart_v3.Accessibility.$Tags.Skippable_content:
      return "skippable-content";
    case Cart_v3.Accessibility.$Tags.Subtitles:
      return "subtitles";
    case Cart_v3.Accessibility.$Tags.Voiced_text:
      return "voiced-text";
    default:
      throw unreachable(x);
  }
}

function duration(x: Cart_v3.Duration) {
  switch (x["@variant"]) {
    case Cart_v3.Duration.$Tags.Seconds:
      return "seconds";
    case Cart_v3.Duration.$Tags.Few_minutes:
      return "few-minutes";
    case Cart_v3.Duration.$Tags.Half_hour:
      return "half-hour";
    case Cart_v3.Duration.$Tags.One_hour:
      return "one-hour";
    case Cart_v3.Duration.$Tags.Few_hours:
      return "few-hours";
    case Cart_v3.Duration.$Tags.Several_hours:
      return "several-hours";
    case Cart_v3.Duration.$Tags.Unknown:
      return "unknown";
    default:
      throw unreachable(x);
  }
}

function input_method(x: Cart_v3.Input_method) {
  switch (x["@variant"]) {
    case Cart_v3.Input_method.$Tags.Kate_buttons:
      return "kate-buttons";
    case Cart_v3.Input_method.$Tags.Touch:
      return "touch";
    default:
      throw unreachable(x);
  }
}

const valid_language = regex(
  "language iso-code",
  /^[a-z]{2}(?:[\-_][a-zA-Z_]{2,})?$/
);

function language(x: Cart_v3.Language): Language {
  return {
    iso_code: valid_language(str(x["iso-code"], 255)),
    audio: x.audio,
    interface: x.interface,
    text: x.text,
  };
}

function player_range(x: PlayerRange | null) {
  if (x == null) {
    return null;
  } else {
    return { maximum: x.maximum, minimum: x.minimum };
  }
}

function date(x: Cart_v3.Date): Date {
  return new Date(x.year, x.month - 1, x.day, 0, 0, 0, 0);
}

const tag = regex("tag", /^[a-z\-]+$/);
const valid_id = regex(
  "id",
  /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\/[a-z0-9\-]+(\.[a-z0-9\-]+)*$/
);
