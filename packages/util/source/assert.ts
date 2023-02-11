export function unreachable(x: never, message: string = "") {
  throw new Error(`Unhandled value(${message}): ${x}`);
}
