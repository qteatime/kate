/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function load_image(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Loading image from ${url} failed`));
    img.src = url;
  });
}

export function load_image_from_bytes(mime: string, bytes: Uint8Array) {
  const blob = new Blob([bytes.buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  return img;
}

export async function make_empty_thumbnail(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.toDataURL();
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
  const rect = fit_media(image, { width, height });
  context.fillStyle = "#2f2f2f";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  return canvas.toDataURL("image/png");
}

type Dimensions = { width: number; height: number };
type Rect = { x: number; y: number } & Dimensions;

function fit_media(
  media: HTMLImageElement | HTMLVideoElement,
  canvas: Dimensions
) {
  if (media instanceof HTMLImageElement) {
    return fit_image(media, canvas);
  } else if (media instanceof HTMLVideoElement) {
    return fit_video(media, canvas);
  } else {
    throw new Error(`Unsupported media`);
  }
}

function fit_image(img: HTMLImageElement, canvas: Dimensions) {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  return fit({ width, height }, canvas);
}

function fit_video(video: HTMLVideoElement, canvas: Dimensions) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  return fit({ width, height }, canvas);
}

function fit(box: Dimensions, target: Dimensions): Rect {
  const wscale = target.width / box.width;
  const hscale = target.height / box.height;
  const scale = Math.min(wscale, hscale);

  const width = Math.floor(scale * box.width);
  const height = Math.floor(scale * box.height);

  return {
    width,
    height,
    x: Math.floor((target.width - width) / 2),
    y: Math.floor((target.height - height) / 2),
  };
}
