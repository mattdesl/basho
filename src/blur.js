import stackblur from "stackblur";

export default function blur(image, { radius = 4, maxSize = 32 }) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const srcWidth = image.width;
  const srcHeight = image.height;
  const ratio =
    srcWidth < maxSize && srcHeight < maxSize
      ? 1
      : Math.min(maxSize / srcWidth, maxSize / srcHeight);

  const newWidth = Math.round(srcWidth * ratio);
  const newHeight = Math.round(srcHeight * ratio);

  canvas.width = newWidth;
  canvas.height = newHeight;
  context.drawImage(image, 0, 0, newWidth, newHeight);

  const imgData = context.getImageData(0, 0, newWidth, newHeight);
  const pixels = imgData.data;
  stackblur(pixels, newWidth, newHeight, radius);
  context.putImageData(imgData, 0, 0);
  return canvas;
}
