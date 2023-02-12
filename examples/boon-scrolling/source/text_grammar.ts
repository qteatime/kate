import { generate, many, term } from "./gen";

const grammar = {
  text: many(term("line"), 1, 3, "\n"),
  line: many("█", 5, 40, ""),
};

export function gen_text() {
  return generate(grammar.text, grammar);
}
