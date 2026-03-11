export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export async function generateThumbnail(
  blob: Blob,
  maxWidth: number,
): Promise<Blob> {
  const img = await loadImageFromBlob(blob);
  const scale = maxWidth / img.width;
  const width = maxWidth;
  const height = Math.round(img.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  return await canvas.convertToBlob({ type: 'image/png' });
}

export async function blobToCanvas(
  blob: Blob,
): Promise<{ canvas: OffscreenCanvas; ctx: OffscreenCanvasRenderingContext2D }> {
  const img = await loadImageFromBlob(blob);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
}
