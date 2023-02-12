const noun = [
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
];

const adj = [
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
];

const comm_status = ["open", "closed"];

const conventions = ["ghostcon", "karacon", "artsying", "cutejam"];

const suffix_type: ("none" | "comms" | "event")[] = [
  "none",
  "none",
  "none",
  "none",
  "comms",
  "event",
];

const emoji = [
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
];

function pick<A>(xs: A[]) {
  const index = Math.floor(Math.random() * xs.length);
  return { value: xs[index], index };
}

function roll_dice(n: number) {
  return Math.floor(Math.random() * n);
}

function flip_coin() {
  return Math.random() > 0.5;
}

function gen_emoji(n: number = 2): string {
  if (flip_coin()) {
    const x = pick(emoji);
    if (n > 0 && flip_coin()) {
      return x.value + gen_emoji(n - 1);
    } else {
      return x.value;
    }
  } else {
    return "";
  }
}

function gen_suffix() {
  switch (pick(suffix_type).value) {
    case "none": {
      return "";
    }
    case "comms": {
      return `| COMMS ${pick(comm_status).value.toUpperCase()}`;
    }
    case "event": {
      return `@ ${pick(conventions).value}${roll_dice(15) + 90}`;
    }
  }
}

export function gen_name() {
  const name = [pick(adj).value, pick(noun).value].join(" ");
  const user = name.toLowerCase().replace(/\W/g, "_");
  return {
    user: `@${user}`,
    name: [name, gen_emoji(), gen_suffix()]
      .filter((x) => x != "")
      .join(" ")
      .trim(),
  };
}
