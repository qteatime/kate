export function serialise_error(x: any) {
  if (x == null) {
    return null;
  } else if (x instanceof Error) {
    return {
      name: x.name,
      message: x.message,
      stack: x.stack ?? null,
    };
  } else {
    return String(x);
  }
}
