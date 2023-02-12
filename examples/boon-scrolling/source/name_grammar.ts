import { capitalise, choice, generate, int, many, seq, term } from "./gen";

const grammar = {
  noun: choice([
    "girl",
    "boy",
    "ghost",
    "train",
    "pan",
    "bread",
    "lesbian",
    "gay",
    "ace",
    "bi",
    "cat",
    "kat",
    "maiden",
    "pudding",
    "machine",
  ]),

  adj: choice([
    "soft",
    "cute",
    "tiny",
    "smol",
    "tol",
    "fluffy",
    "pretty",
    "ikemen",
    "lolita",
    "decora",
    "spoopy",
    "magical",
    "pocket",
    "sword",
    "shield",
    "green",
    "gaming",
  ]),

  name: choice([
    seq([capitalise(term("adj")), " ", capitalise(term("noun"))]),
    seq([term("adj"), " ", term("noun")]),
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
