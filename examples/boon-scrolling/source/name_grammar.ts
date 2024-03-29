import {
  capitalise,
  choice,
  downcase,
  generate,
  int,
  many,
  seq,
  term,
} from "./gen";

const grammar = {
  noun: choice([
    "Girl",
    "Boy",
    "Kid",
    "Maiden",
    "Lady",
    "Gentleman",
    "Dude",
    "Ghost",
    "Train",
    "Machine",
    "Robot",
    "Bread",
    "Pan",
    "Cat",
    "Dog",
    "Shark",
    "Hamster",
    "Pudding",
  ]),

  aesthetic: choice([
    "Soft",
    "Cute",
    "Fluffy",
    "Comfy",
    "Cozy",
    "Tiny",
    "Smol",
    "Tol",
    "Sweet",
    "Pretty",
    "Ikemen",
    "Pocket",
    "Spoopy",
    "Lolita",
    "Gothic Lolita",
    "Classic Lolita",
    "Country Lolita",
    "Pink",
    "Green",
    "Decora",
    "Mori",
    "Cottagecore",
    "Pastel",
    "Pastel Goth",
    "Goth",
    "Gyaru",
    "Fairy Kei",
    "Dolly Kei",
    "Emo",
    "Cult Party Kei",
    "Dark Academia",
    "Visual Kei",
    "Yumekawa",
    "Wota",
    "Artsy",
    "Creepy-cute",
    "Baroque",
    "Edwardian",
    "Victorian",
    "Rococo",
    "Regency",
    "Forest",
    "Plant",
    "Flower",
    "Magical",
    "Sword",
    "Gamer",
    "Ethereal",
    "Vaporwave",
    "Glitch Pop",
    "Rock",
    "Metal",
    "Heavy Metal",
    "City Pop",
    "Pop",
    "Anime",
    "Arcade",
    "Autumn",
    "Summer",
    "Winter",
    "Spring",
    "Rainy",
    "Sunny",
    "Snowy",
    "Cyber",
    "Steampunk",
    "Solarpunk",
    "Fantasy",
    "Noir",
    "Surreal",
    "Glam",
    "Indie",
    "Kawaii",
    "Minimalist",
    "Pixel",
    "Hand-drawn",
    "Low-poly",
    "Witch",
    "Pirate",
    "Vampire",
    "Queer",
    "Gay",
    "Ace",
  ]),

  era: choice([
    "60's",
    "70's",
    "80's",
    "90's",
    "00's",
    "Retro",
    "Vintage",
    "1-bit",
    "8-bit",
    "16-bit",
  ]),

  full_aesthetic: choice([
    seq([term("era"), " ", term("aesthetic")]),
    seq([term("aesthetic")]),
    seq([term("aesthetic")]),
    seq([term("aesthetic")]),
  ]),

  name: choice([
    seq([downcase(term("full_aesthetic")), " ", downcase(term("noun"))]),
    seq([term("full_aesthetic"), " ", term("noun")]),
  ]),

  emoji_suffix: many(term("emoji"), 0, 3, ""),

  emoji: choice([
    "🐻",
    "👻",
    "👾",
    "🦊",
    "🐹",
    "🐸",
    "🦄",
    "😺",
    "🐶",
    "🦖",
    "🦈",
    "🦀",
    "🐙",
    "🐣",
    "🐞",
    "🧑‍🦽",
    "🚴",
    "🦻",
    "✨",
    "🎃",
    "🎶",
    "🧁",
    "🍫",
    "🍒",
    "🍅",
    "🌸",
    "🌷",
    "🌈",
    "❤️",
    "🤍",
    "🖤",
    "💜",
  ]),

  suffix: choice(["", "", "", "", term("comm_status"), term("con_status")]),

  comm_status: seq(["| COMMS ", choice(["OPEN", "CLOSED"])]),

  con_status: seq(["@ ", term("con_name"), int(90, 110)]),

  con_name: choice(["ghostcon", "karacon", "artsying", "cutejam"]),
};

export function gen_name() {
  const name = generate(grammar.name, grammar);
  const user = name.toLowerCase().replace(/\W/g, "_");
  const emoji = generate(grammar.emoji_suffix, grammar);
  const suffix = generate(grammar.suffix, grammar);

  return {
    user: `@${user}`,
    name: [name, emoji, suffix]
      .filter((x) => x != "")
      .join(" ")
      .trim(),
  };
}
