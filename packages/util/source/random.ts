export function make_id() {
  let id = new Uint8Array(16);
  crypto.getRandomValues(id);
  return Array.from(id)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
