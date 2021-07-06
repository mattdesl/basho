import gifenc from "gifenc";
import getPixelsAsync from "get-pixels";
import fs from "fs/promises";
import { promisify } from "util";
import CanvasAPI from "canvas";
import pkg from "canvas-sketch-util";
import luminance from "color-luminance";
import objectFit from "./fit.js";
import path from "path";

const hexToRGB = (str) => {
  var hex = str.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  var num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
};

// import {haltonND} from "@thi.ng/lowdisc";

const Random = pkg.random;
const clamp = (value, min, max) => Math.max(Math.min(value, max), min);

const { loadImage, createCanvas } = CanvasAPI;
const { GIFEncoder, quantize, applyPalette } = gifenc;
const getPixels = promisify(getPixelsAsync);
let tmpCanvas, tmpContext;

const DESATURATED_PALETTE = [
  [0, 0, 0],
  [255, 255, 255],
  [0, 255, 0],
  [0, 0, 255],
  [255, 0, 0],
  [255, 255, 0],
  [255, 140, 0],
  [255, 255, 255], // clear
];

const SATURATED_PALETTE = [
  [57, 48, 57],
  [255, 255, 255],
  [58, 91, 70],
  [61, 59, 94],
  [156, 72, 75],
  [208, 190, 71],
  [177, 106, 73],
  [255, 255, 255], // clear
];

const INKY_WIDTH = 600;
const INKY_HEIGHT = 448;

function palette_blend(saturation = 0.5) {
  const palette = [];
  for (let i = 0; i < SATURATED_PALETTE.length - 1; i++) {
    const rgb_sat = SATURATED_PALETTE[i];
    const rgb_desat = DESATURATED_PALETTE[i];
    const rgb = [];
    for (let c = 0; c < rgb_sat.length; c++) {
      const sat = rgb_sat[c] * saturation;
      const desat = rgb_desat[c] * (1 - saturation);
      const n = Math.floor(sat + desat);
      rgb.push(n);
    }
    palette.push(rgb);
  }
  return palette;
}

function getBitmapRGBA(bitmap, width = bitmap.width, height = bitmap.height) {
  if (!tmpCanvas) {
    tmpCanvas = createCanvas(width, height);
    tmpContext = tmpCanvas.getContext("2d");
  } else {
    tmpCanvas.width = width;
    tmpCanvas.height = height;
  }
  tmpContext.clearRect(0, 0, width, height);
  tmpContext.drawImage(bitmap, 0, 0, width, height);
  return tmpContext.getImageData(0, 0, width, height).data;
}

(async () => {
  // const image = await loadImage("lenna.png");
  const saturation = process.argv[3] || 0.5;

  const inFileName = process.argv[2] || "042.png";
  const outFileName =
    path.basename(inFileName, path.extname(inFileName)) +
    `-dither-${saturation}.png`;

  const image = await loadImage(inFileName);

  console.log("Size", image.width, image.height);
  const [tx, ty, w, h, sx, sy] = objectFit({
    parentWidth: INKY_WIDTH,
    parentHeight: INKY_HEIGHT,
    fit: "cover",
    childWidth: image.width,
    childHeight: image.height,
  });

  const canvas = createCanvas(INKY_WIDTH, INKY_HEIGHT);
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, INKY_WIDTH, INKY_HEIGHT);
  context.fillStyle = "white";
  context.fillRect(0, 0, INKY_WIDTH, INKY_HEIGHT);
  context.save();
  context.translate(tx, ty);
  context.scale(sx, sy);
  context.drawImage(image, 0, 0);
  context.restore();

  // context.beginPath();
  // context.rect(0, 0, INKY_WIDTH, INKY_HEIGHT);
  // context.lineWidth = 4;
  // context.strokeStyle = "white";
  // context.stroke();
  // await fs.writeFile("test_rgb.png", canvas.toBuffer("image/png"));

  const pixels = getBitmapRGBA(canvas);
  // const palette = [
  //   "#325b55",
  //   "#f6f7f3",
  //   "#6aa75b",
  //   "#53688a",
  //   "#b74438",
  //   "#e2c83c",
  //   "#c45b41",
  // ].map((hex) => hexToRGB(hex));
  const mono = process.argv.includes("mono");
  let palette = palette_blend(saturation);
  if (mono) {
    palette = [
      [0, 0, 0],
      [255, 255, 255],
    ];
  }
  // palette[2] = [0, 0, 0];
  // const palette = quantize(pixels, 6);
  console.log(palette);
  const indexedImage = applyPalette(pixels, palette);
  const rgba = new Uint8Array(INKY_WIDTH * INKY_HEIGHT * 4);
  for (let i = 0; i < INKY_WIDTH * INKY_HEIGHT; i++) {
    // const index = indexedImage[i];
    const origR = pixels[i * 4 + 0];
    const origG = pixels[i * 4 + 1];
    const origB = pixels[i * 4 + 2];
    const origL = luminance(origR, origG, origB);

    const L = origL / 0xff + (Math.random() - 0.5) > 0.5 ? 0xff : 0;
    // const paletteRGB = palette[index];
    // const paletteRGB = [L, L, L];
    const paletteRGB = [origR, origG, origB];
    rgba[i * 4 + 0] = paletteRGB[0];
    rgba[i * 4 + 1] = paletteRGB[1];
    rgba[i * 4 + 2] = paletteRGB[2];
    rgba[i * 4 + 3] = 0xff;
  }

  const imgData = context.createImageData(INKY_WIDTH, INKY_HEIGHT);

  imgData.data.set(rgba);
  imgData.data.set(floydSteinberg(rgba, INKY_WIDTH, INKY_HEIGHT, palette));

  const uniqs = new Set();
  for (let i = 0; i < INKY_WIDTH * INKY_HEIGHT; i++) {
    // const index = indexedImage[i];
    const r = imgData.data[i * 4 + 0];
    const g = imgData.data[i * 4 + 1];
    const b = imgData.data[i * 4 + 2];
    const hex = rgbToHex([r, g, b]);
    uniqs.add(hex);
  }
  console.log(uniqs.size);

  context.putImageData(imgData, 0, 0);

  await fs.writeFile(outFileName, canvas.toBuffer("image/png"));
  // const image = await getPixels("viewer/53000004.png");
})();

function floydSteinberg(pixels, width, height, palette) {
  const data = new Uint8ClampedArray(pixels);
  const format = "rgb565";
  const bincount = format === "rgb444" ? 4096 : 65536;
  const cache = new Array(bincount);
  const error = [0, 0, 0];
  step(true);
  step(false);
  return data;

  function step(randomly) {
    for (let y = 0; y < height; y++) {
      let leftToRight = y % 2 === 0;
      for (let ox = 0; ox < width; ox++) {
        // const leftToRight = true;
        // const leftToRight = Math.random() > 0.5;
        if (randomly) leftToRight = Math.random() > 0.5;
        const x = leftToRight ? ox : width - ox - 1;

        const index = toIndex(x, y, width, height);

        // get the old color
        const oldR = data[index + 0];
        const oldG = data[index + 1];
        const oldB = data[index + 2];
        // reduce to our palette
        const key = rgb888_to_rgb565(oldR, oldG, oldB);
        const idx =
          key in cache
            ? cache[key]
            : (cache[key] = nearestColorIndexRGB(oldR, oldG, oldB, palette));
        const newRGB = palette[idx];
        // now we have a new RGB color for this pixel
        const newR = newRGB[0];
        const newG = newRGB[1];
        const newB = newRGB[2];
        error[0] = oldR - newR;
        error[1] = oldG - newG;
        error[2] = oldB - newB;

        const down = toIndex(x, y + 1, width, height);
        const rightDown = toIndex(x + 1, y + 1, width, height);
        const right = toIndex(x + 1, y, width, height);
        const left = toIndex(x - 1, y, width, height);
        const rightUp = toIndex(x + 1, y - 1, width, height);
        const leftDown = toIndex(x - 1, y + 1, width, height);

        data[index] = newR;
        data[index + 1] = newG;
        data[index + 2] = newB;
        data[index + 3] = 0xff;

        for (let c = 0; c < 3; c++) {
          if (leftToRight) {
            if (x >= 0 && y < height - 1)
              data[down + c] = data[down + c] + (error[c] * 5) / 16;
            if (x < width - 1 && y < height - 1)
              data[rightDown + c] = data[rightDown + c] + (error[c] * 1) / 16;
            if (y >= 0 && x < width - 1)
              data[right + c] = data[right + c] + (error[c] * 7) / 16;
            if (x > 0 && y < height - 1)
              data[leftDown + c] = data[leftDown + c] + (error[c] * 3) / 16;
          } else {
            if (x >= 0 && y < height - 1)
              data[down + c] = data[down + c] + (error[c] * 5) / 16;
            if (x > 0 && y < height - 1)
              data[leftDown + c] = data[leftDown + c] + (error[c] * 1) / 16;
            if (y >= 0 && x > 0)
              data[left + c] = data[left + c] + (error[c] * 7) / 16;
            if (x < width - 1 && y < height - 1)
              data[rightDown + c] = data[rightDown + c] + (error[c] * 3) / 16;
          }
        }
      }
    }
  }
}

function rgb888_to_rgb565(r, g, b) {
  return ((r << 8) & 0xf800) | ((g << 2) & 0x03e0) | (b >> 3);
}

function nearestColorIndexRGB(r, g, b, palette) {
  let k = 0;
  let mindist = 1e100;
  for (let i = 0; i < palette.length; i++) {
    const px2 = palette[i];
    const r2 = px2[0];
    let curdist = sqr(r2 - r);
    if (curdist > mindist) continue;
    const g2 = px2[1];
    curdist += sqr(g2 - g);
    if (curdist > mindist) continue;
    const b2 = px2[2];
    curdist += sqr(b2 - b);
    if (curdist > mindist) continue;
    mindist = curdist;
    k = i;
  }
  return k;
}

function floydSteinbergPixelOld(pixels, x, y, width) {
  const factor = 2;
  let index = toIndex(x, y, width);

  let red = pixels[index];
  let green = pixels[index + 1];
  let blue = pixels[index + 2];

  let newRed = Math.round((factor * red) / 255) * (255 / factor);
  let newGreen = Math.round((factor * green) / 255) * (255 / factor);
  let newBlue = Math.round((factor * blue) / 255) * (255 / factor);

  pixels[index] = newRed;
  pixels[index + 1] = newGreen;
  pixels[index + 2] = newBlue;

  let errorRed = red - newRed;
  let errorGreen = green - newGreen;
  let errorBlue = blue - newBlue;

  const right = toIndex(x + 1, y, width);
  const leftDown = toIndex(x - 1, y + 1, width);
  const down = toIndex(x, y + 1, width);
  const rightDown = toIndex(x + 1, y + 1, width);
  const K = 16;

  pixels[right] = pixels[right] + (errorRed * 7) / K;
  pixels[right + 1] = pixels[right + 1] + (errorGreen * 7) / K;
  pixels[right + 2] = pixels[right + 2] + (errorBlue * 7) / K;

  if (x > 0) {
    pixels[leftDown] = pixels[leftDown] + (errorRed * 3) / K;
    pixels[leftDown + 1] = pixels[leftDown + 1] + (errorGreen * 3) / K;
    pixels[leftDown + 2] = pixels[leftDown + 2] + (errorBlue * 3) / K;
  }

  pixels[down] = pixels[down] + (errorRed * 5) / K;
  pixels[down + 1] = pixels[down + 1] + (errorGreen * 5) / K;
  pixels[down + 2] = pixels[down + 2] + (errorBlue * 5) / K;

  pixels[rightDown] = pixels[rightDown] + (errorRed * 1) / K;
  pixels[rightDown + 1] = pixels[rightDown + 1] + (errorGreen * 1) / K;
  pixels[rightDown + 2] = pixels[rightDown + 2] + (errorBlue * 1) / K;
}

function toIndex(x, y, width, height) {
  x = Math.floor(x);
  y = Math.floor(y);
  x = clamp(x, 0, width - 1);
  y = clamp(y, 0, height - 1);
  return (x + y * width) * 4;
}

function sqr(a) {
  return a * a;
}

function rgbToHex(rgb) {
  var r = clamp(~~rgb[0], 0, 255);
  var g = clamp(~~rgb[1], 0, 255);
  var b = clamp(~~rgb[2], 0, 255);
  return "#" + (b | (g << 8) | (r << 16) | (1 << 24)).toString(16).slice(1);
}
