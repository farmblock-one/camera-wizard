export interface CropRect {
  /** All values normalized to the source image (0–1). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

export type Drawable = ImageBitmap | HTMLImageElement | HTMLCanvasElement;

/** Decode an image file, applying the EXIF rotation. */
export async function loadImage(blob: Blob): Promise<Drawable> {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export function sizeOf(img: Drawable): { width: number; height: number } {
  return 'naturalWidth' in img ? { width: img.naturalWidth, height: img.naturalHeight } : { width: img.width, height: img.height };
}

/** Crop (normalized rect) and downscale so the longest side is at most `maxDim`. */
export function cropToCanvas(img: Drawable, crop: CropRect, maxDim: number): HTMLCanvasElement {
  const { width, height } = sizeOf(img);
  const sx = Math.round(crop.x * width);
  const sy = Math.round(crop.y * height);
  const sw = Math.max(1, Math.round(crop.w * width));
  const sh = Math.max(1, Math.round(crop.h * height));
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không tạo được ảnh'))), 'image/jpeg', quality),
  );
}
