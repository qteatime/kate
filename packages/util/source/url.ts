export function file_to_dataurl(file: { mime: string; data: Uint8Array }) {
  const content = Array.from(file.data)
    .map((x) => String.fromCharCode(x))
    .join("");
  return `data:${file.mime};base64,${btoa(content)}`;
}
