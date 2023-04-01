export function load_image(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Loading image from ${url} failed`));
    img.src = url;
  });
}

export async function make_thumbnail_from_bytes(
  width: number,
  height: number,
  mime: string,
  data: Uint8Array
) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    const image = await load_image(url);
    return make_thumbnail(width, height, image);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function make_thumbnail(
  width: number,
  height: number,
  image: HTMLImageElement | HTMLVideoElement
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}
