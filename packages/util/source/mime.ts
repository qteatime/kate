export function to_extension(mime: string) {
  switch (mime) {
    case "image/png":
      return ".png";
    case "video/webm":
      return ".webm";
    default:
      return "";
  }
}
