export function pick<A>(xs: A[]) {
  const index = Math.floor(Math.random() * xs.length);
  return { value: xs[index], index };
}

export function roll_dice(n: number) {
  return Math.floor(Math.random() * n);
}

export function flip_coin() {
  return Math.random() > 0.5;
}

export abstract class Expr {
  abstract generate(g: Grammar): string;
}

type ToExpr = string | Expr;
type Grammar = { [key: string]: ToExpr };

export class Choice extends Expr {
  constructor(readonly items: ToExpr[]) {
    super();
  }
  generate(g: Grammar) {
    return generate(pick(this.items).value, g);
  }
}

export class Seq extends Expr {
  constructor(readonly items: ToExpr[]) {
    super();
  }
  generate(g: Grammar) {
    return this.items.map((x) => generate(x, g)).join("");
  }
}

export class Term extends Expr {
  constructor(readonly name: string) {
    super();
  }
  generate(g: Grammar) {
    return generate(g[this.name], g);
  }
}

export class Opt extends Expr {
  constructor(readonly term: ToExpr) {
    super();
  }
  generate(g: Grammar) {
    return flip_coin() ? generate(this.term, g) : "";
  }
}

export class Int extends Expr {
  constructor(readonly min: number, readonly max: number) {
    super();
  }
  generate(g: Grammar) {
    const d = this.max - this.min;
    return String(this.min + roll_dice(d));
  }
}

export class Many extends Expr {
  constructor(
    readonly term: ToExpr,
    readonly min: number,
    readonly max: number,
    readonly separator: string
  ) {
    super();
  }

  generate(g: Grammar) {
    const n = this.min + roll_dice(this.max - this.min);
    return Array.from({ length: n }, () => generate(this.term, g)).join(
      this.separator
    );
  }
}

export class Map extends Expr {
  constructor(readonly term: ToExpr, readonly fn: (_: string) => string) {
    super();
  }

  generate(g: Grammar) {
    return this.fn(generate(this.term, g));
  }
}

export function generate(x: ToExpr, g: Grammar) {
  if (typeof x === "string") {
    return x;
  } else {
    return x.generate(g);
  }
}

export function choice(items: ToExpr[]) {
  return new Choice(items);
}

export function seq(items: ToExpr[]) {
  return new Seq(items);
}

export function term(name: string) {
  return new Term(name);
}

export function opt(item: ToExpr) {
  return new Opt(item);
}

export function int(min: number, max: number) {
  return new Int(min, max);
}

export function many(
  term: ToExpr,
  min: number,
  max: number,
  separator: string
) {
  return new Many(term, min, max, separator);
}

export function map(item: ToExpr, fn: (_: string) => string) {
  return new Map(item, fn);
}

export function capitalise(item: ToExpr) {
  return map(
    item,
    (x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()
  );
}

export function upcase(item: ToExpr) {
  return map(item, (x) => x.toUpperCase());
}

export function downcase(item: ToExpr) {
  return map(item, (x) => x.toLocaleLowerCase());
}
