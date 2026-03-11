import { blobToCanvas } from './imageUtils';

// SVG-based stamp shape — matches the reference design exactly
// The SVG path is defined in a 151×204 coordinate space
const SVG_WIDTH = 151;
const SVG_HEIGHT = 204;

// Display scale: how we map SVG coords → display pixels
const DISPLAY_WIDTH = 128;
const DISPLAY_SCALE = DISPLAY_WIDTH / SVG_WIDTH;
const DISPLAY_HEIGHT = Math.round(SVG_HEIGHT * DISPLAY_SCALE);

// Inner rectangle from SVG (where the image shows through)
const SVG_INNER_X = 14.0537;
const SVG_INNER_Y = 13.4209;
const SVG_INNER_W = 136.94 - 14.0537;
const SVG_INNER_H = 189.516 - 13.4209;

const INNER_X = SVG_INNER_X * DISPLAY_SCALE;
const INNER_Y = SVG_INNER_Y * DISPLAY_SCALE;
const INNER_W = SVG_INNER_W * DISPLAY_SCALE;
const INNER_H = SVG_INNER_H * DISPLAY_SCALE;

// Outer scalloped path from reference SVG
const STAMP_SVG_D = 'M22.0791 0.751953C22.1381 3.63886 24.4875 5.95898 27.3857 5.95898C30.2839 5.95886 32.6334 3.63879 32.6924 0.751953H38.0049C38.0639 3.63886 40.4132 5.95898 43.3115 5.95898C46.2097 5.95888 48.5591 3.6388 48.6182 0.751953H53.9307C53.9897 3.63886 56.339 5.95898 59.2373 5.95898C62.1355 5.9589 64.4849 3.63881 64.5439 0.751953H69.8564C69.9155 3.63886 72.2648 5.95898 75.1631 5.95898C78.0613 5.95893 80.4107 3.63883 80.4697 0.751953H85.7822C85.8413 3.63886 88.1906 5.95898 91.0889 5.95898C93.9871 5.95894 96.3365 3.63884 96.3955 0.751953H101.708C101.767 3.63886 104.116 5.95898 107.015 5.95898C109.913 5.95897 112.262 3.63886 112.321 0.751953H117.634C117.693 3.63886 120.042 5.95898 122.94 5.95898C125.839 5.95898 128.188 3.63887 128.247 0.751953H133.56V0.858398C133.56 3.79243 135.938 6.17182 138.872 6.17188C141.806 6.17188 144.184 3.79246 144.185 0.858398V0.751953H149.609V5.66406C146.723 5.72312 144.403 8.07298 144.403 10.9717C144.404 13.8702 146.723 16.2193 149.609 16.2783V20.7539H149.503C146.569 20.754 144.19 23.1333 144.19 26.0674C144.191 29.0013 146.569 31.3807 149.503 31.3809H149.609V35.8555H149.503C146.569 35.8556 144.19 38.2349 144.19 41.1689C144.191 44.1029 146.569 46.4823 149.503 46.4824H149.609V50.957H149.503C146.569 50.9572 144.19 53.3364 144.19 56.2705C144.19 59.2045 146.569 61.5839 149.503 61.584H149.609V66.0586H149.503C146.569 66.0587 144.19 68.438 144.19 71.3721C144.19 74.3061 146.569 76.6854 149.503 76.6855H149.609V81.1602H149.503C146.569 81.1603 144.191 83.5396 144.19 86.4736C144.19 89.4077 146.569 91.787 149.503 91.7871H149.609V96.2617H149.503C146.569 96.2618 144.191 98.6412 144.19 101.575C144.19 104.509 146.569 106.889 149.503 106.889H149.609V111.364H149.503C146.569 111.364 144.191 113.743 144.19 116.677C144.19 119.611 146.569 121.99 149.503 121.99H149.609V126.466H149.503C146.569 126.466 144.191 128.844 144.19 131.778C144.19 134.712 146.569 137.092 149.503 137.092H149.609V141.567H149.503C146.569 141.568 144.19 143.947 144.19 146.881C144.191 149.815 146.569 152.193 149.503 152.193H149.609V156.669H149.503C146.569 156.669 144.19 159.048 144.19 161.982C144.191 164.916 146.569 167.296 149.503 167.296H149.609V171.771H149.503C146.569 171.771 144.19 174.15 144.19 177.084C144.191 180.018 146.569 182.397 149.503 182.397H149.609V186.872H149.503C146.569 186.872 144.19 189.251 144.19 192.186C144.19 195.12 146.569 197.499 149.503 197.499H149.609V202.818H144.185C144.126 199.931 141.776 197.611 138.878 197.611C135.98 197.611 133.63 199.931 133.571 202.818H128.259V202.712C128.259 199.778 125.88 197.398 122.946 197.398C120.013 197.398 117.634 199.778 117.634 202.712V202.818H112.321V202.712C112.321 199.778 109.942 197.398 107.009 197.398C104.075 197.398 101.696 199.778 101.696 202.712V202.818H96.3838V202.712C96.3838 199.778 94.0049 197.399 91.0713 197.398C88.1376 197.398 85.7588 199.778 85.7588 202.712V202.818H80.4463V202.712C80.4463 199.778 78.0673 197.399 75.1338 197.398C72.2001 197.398 69.8213 199.778 69.8213 202.712V202.818H64.5088V202.712C64.5088 199.778 62.1298 197.399 59.1963 197.398C56.2626 197.398 53.8828 199.778 53.8828 202.712V202.818H48.5703V202.712C48.5703 199.778 46.1915 197.398 43.2578 197.398C40.3243 197.399 37.9453 199.778 37.9453 202.712V202.818H32.6328V202.712C32.6328 199.778 30.254 197.398 27.3203 197.398C24.3867 197.399 22.0078 199.778 22.0078 202.712V202.818H16.6953V202.712C16.6953 199.778 14.3165 197.398 11.3828 197.398C8.44917 197.399 6.07031 199.778 6.07031 202.712V202.818H0.751953V197.505C3.68566 197.505 6.06445 195.126 6.06445 192.191C6.06445 189.257 3.68566 186.878 0.751953 186.878V182.415C3.68565 182.415 6.06444 180.036 6.06445 177.102C6.06445 174.167 3.68566 171.788 0.751953 171.788V167.325C3.68564 167.325 6.06442 164.946 6.06445 162.012C6.06445 159.078 3.68566 156.698 0.751953 156.698V152.235C3.68563 152.235 6.06441 149.856 6.06445 146.922C6.06445 143.988 3.68566 141.608 0.751953 141.608V137.146C3.68562 137.146 6.06439 134.766 6.06445 131.832C6.06445 128.898 3.68566 126.519 0.751953 126.519V122.056C3.68561 122.056 6.06437 119.676 6.06445 116.742C6.06445 113.808 3.68566 111.429 0.751953 111.429V106.966C3.6856 106.966 6.06436 104.586 6.06445 101.652C6.06445 98.7182 3.68566 96.3389 0.751953 96.3389V91.876C3.68559 91.876 6.06434 89.4965 6.06445 86.5625C6.06445 83.6284 3.68566 81.249 0.751953 81.249V76.7861C3.68558 76.7861 6.06433 74.4067 6.06445 71.4727C6.06445 68.5385 3.68566 66.1592 0.751953 66.1592V61.6963C3.68557 61.6963 6.06431 59.3168 6.06445 56.3828C6.06445 53.4487 3.68566 51.0693 0.751953 51.0693V46.6064C3.68556 46.6064 6.0643 44.227 6.06445 41.293C6.06445 38.3588 3.68566 35.9795 0.751953 35.9795V31.5166C3.68555 31.5166 6.06429 29.1371 6.06445 26.2031C6.06445 23.269 3.68566 20.8896 0.751953 20.8896V16.4141C0.822787 16.42 0.89401 16.4268 0.964844 16.4268C3.89826 16.4265 6.27716 14.0471 6.27734 11.1133C6.27734 8.17927 3.89837 5.80001 0.964844 5.7998C0.89401 5.7998 0.822787 5.81152 0.751953 5.81152V0.893555H6.07031V0.895508C6.12956 3.78221 8.56181 5.95898 11.46 5.95898C14.3581 5.95883 16.7076 3.63877 16.7666 0.751953H22.0791Z';

export function getStampDimensions() {
  return { width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT };
}

export function getStampInnerRect() {
  return { x: INNER_X, y: INNER_Y, width: INNER_W, height: INNER_H };
}

// Cached base stamp path in SVG coordinates
let baseSvgPath: Path2D | null = null;

function getSvgPath(): Path2D {
  if (!baseSvgPath) {
    baseSvgPath = new Path2D(STAMP_SVG_D);
  }
  return baseSvgPath;
}

// Base stamp path scaled to display coordinates
let baseDisplayPath: Path2D | null = null;

export function getBaseStampPath(): Path2D {
  if (!baseDisplayPath) {
    const svgPath = getSvgPath();
    baseDisplayPath = new Path2D();
    const transform = new DOMMatrix().scale(DISPLAY_SCALE);
    baseDisplayPath.addPath(svgPath, transform);
  }
  return baseDisplayPath;
}

export function initStamp(): void {
  baseSvgPath = new Path2D(STAMP_SVG_D);
  baseDisplayPath = null; // will be lazily rebuilt
  getBaseStampPath();
}

export function createStampPath2D(
  centerX: number,
  centerY: number,
  scale: number = 1,
): Path2D {
  const svgPath = getSvgPath();
  const path = new Path2D();
  const s = DISPLAY_SCALE * scale;
  const transform = new DOMMatrix()
    .translate(
      centerX - (DISPLAY_WIDTH * scale) / 2,
      centerY - (DISPLAY_HEIGHT * scale) / 2,
    )
    .scale(s);
  path.addPath(svgPath, transform);
  return path;
}

export function validateStampPosition(
  localX: number,
  localY: number,
  imageWidth: number,
  imageHeight: number,
  scale: number = 1,
): boolean {
  const halfW = (DISPLAY_WIDTH * scale) / 2;
  const halfH = (DISPLAY_HEIGHT * scale) / 2;
  return (
    localX - halfW >= 0 &&
    localY - halfH >= 0 &&
    localX + halfW <= imageWidth &&
    localY + halfH <= imageHeight
  );
}

export async function checkOverlap(
  canvasBlob: Blob,
  localX: number,
  localY: number,
  scale: number = 1,
): Promise<boolean> {
  const { canvas: srcCanvas } = await blobToCanvas(canvasBlob);
  const w = Math.ceil(DISPLAY_WIDTH * scale);
  const h = Math.ceil(DISPLAY_HEIGHT * scale);
  const stampPath = createStampPath2D(w / 2, h / 2, scale);

  // Create a mask of which pixels are inside the stamp shape
  const maskCanvas = new OffscreenCanvas(w, h);
  const maskCtx = maskCanvas.getContext('2d')!;
  maskCtx.fillStyle = 'white';
  maskCtx.fill(stampPath);
  const maskData = maskCtx.getImageData(0, 0, w, h);

  // Draw the source image region (unclipped)
  const checkCanvas = new OffscreenCanvas(w, h);
  const ctx = checkCanvas.getContext('2d')!;
  const sx = localX - w / 2;
  const sy = localY - h / 2;
  ctx.drawImage(srcCanvas, sx, sy, w, h, 0, 0, w, h);
  const srcData = ctx.getImageData(0, 0, w, h);

  // Check: any pixel inside the stamp shape that is transparent = overlap with hole
  for (let i = 0; i < maskData.data.length; i += 4) {
    if (maskData.data[i + 3] > 0 && srcData.data[i + 3] === 0) {
      return true;
    }
  }
  return false;
}

export async function extractStamp(
  canvasBlob: Blob,
  localX: number,
  localY: number,
  scale: number = 1,
): Promise<Blob> {
  const { canvas: srcCanvas } = await blobToCanvas(canvasBlob);
  const w = Math.ceil(DISPLAY_WIDTH * scale);
  const h = Math.ceil(DISPLAY_HEIGHT * scale);
  const stampCanvas = new OffscreenCanvas(w, h);
  const ctx = stampCanvas.getContext('2d')!;

  const stampPath = createStampPath2D(w / 2, h / 2, scale);

  // 1. Clip to scalloped shape, fill white (creates white stamp with border)
  ctx.save();
  ctx.clip(stampPath);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w, h);

  // 2. Clip further to inner rect, draw image (image only in inner area)
  const ix = INNER_X * scale;
  const iy = INNER_Y * scale;
  const iw = INNER_W * scale;
  const ih = INNER_H * scale;
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();

  const sx = localX - w / 2;
  const sy = localY - h / 2;
  ctx.drawImage(srcCanvas, sx, sy, w, h, 0, 0, w, h);
  ctx.restore();

  // 3. Draw 3px stroke around scalloped edge
  ctx.strokeStyle = '#B8B8B8';
  ctx.lineWidth = 3;
  ctx.stroke(stampPath);

  return await stampCanvas.convertToBlob({ type: 'image/png' });
}

export async function punchHole(
  canvasBlob: Blob,
  localX: number,
  localY: number,
  scale: number = 1,
): Promise<Blob> {
  const { canvas, ctx } = await blobToCanvas(canvasBlob);
  const w = DISPLAY_WIDTH * scale;
  const h = DISPLAY_HEIGHT * scale;

  // Punch a rectangular hole matching the inner rect (the actual image content area).
  // The scalloped border is decorative and not part of the extracted image.
  const ix = localX - w / 2 + INNER_X * scale;
  const iy = localY - h / 2 + INNER_Y * scale;
  const iw = INNER_W * scale;
  const ih = INNER_H * scale;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(ix, iy, iw, ih);

  // Draw stroke around the hole edge
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(ix, iy, iw, ih);

  return await canvas.convertToBlob({ type: 'image/png' });
}
