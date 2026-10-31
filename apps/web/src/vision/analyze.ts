import type { Landmark, PersonPose } from '../db/db';
import { getImageEmbedder, getPoseLandmarker, resetVision } from './mediapipe';
import { maskToOutline } from './outline';

export interface Analysis {
  people: PersonPose[];
  /** Background embedding with people greyed out (L2-normalized). */
  sceneEmbedding?: Float32Array;
}

const DETECT_MAX = 1024;

/**
 * Find people in an image, outline each one and fingerprint the background.
 * `canvas` should already be cropped; it is not modified.
 */
export async function analyzeImage(canvas: HTMLCanvasElement): Promise<Analysis> {
  const input = visionInput(canvas, DETECT_MAX);
  const result = await detect(input);

  const people: PersonPose[] = [];
  let combined: Float32Array | null = null;
  let maskW = 0;
  let maskH = 0;
  try {
    for (const [i, lms] of result.landmarks.entries()) {
      const landmarks: Landmark[] = lms.map((l) => [r4(l.x), r4(l.y), r4(l.visibility ?? 1)]);
      const mask = result.segmentationMasks?.[i];
      let outline: PersonPose['outline'] = [];
      if (mask) {
        const data = mask.getAsFloat32Array();
        outline = maskToOutline({ data, width: mask.width, height: mask.height });
        if (!combined) {
          combined = new Float32Array(data.length);
          maskW = mask.width;
          maskH = mask.height;
        }
        if (mask.width === maskW && mask.height === maskH) {
          for (let k = 0; k < data.length; k++) if (data[k] > combined[k]) combined[k] = data[k];
        }
      }
      people.push({ outline, landmarks });
    }
  } finally {
    result.close();
  }

  // Left-to-right, so "person 1" is always the one on the left.
  people.sort((a, b) => meanX(a.landmarks) - meanX(b.landmarks));

  const sceneEmbedding = await embedScene(input, combined, maskW, maskH);
  return { people, sceneEmbedding };
}

/** Embed an image's background. Pass a person mask to grey people out first. */
export async function embedScene(
  canvas: HTMLCanvasElement,
  personMask: Float32Array | null = null,
  maskW = 0,
  maskH = 0,
): Promise<Float32Array | undefined> {
  const src = visionInput(canvas, DETECT_MAX);
  const work = document.createElement('canvas');
  work.width = src.width;
  work.height = src.height;
  const ctx = work.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0);

  if (personMask && maskW && maskH) {
    const img = ctx.getImageData(0, 0, work.width, work.height);
    const px = img.data;
    for (let y = 0; y < work.height; y++) {
      const my = Math.min(maskH - 1, Math.floor((y * maskH) / work.height));
      for (let x = 0; x < work.width; x++) {
        const mx = Math.min(maskW - 1, Math.floor((x * maskW) / work.width));
        if (personMask[my * maskW + mx] > 0.3) {
          const o = (y * work.width + x) * 4;
          px[o] = px[o + 1] = px[o + 2] = 128;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  const embedder = await getImageEmbedder();
  try {
    const v = embedder.embed(work).embeddings[0]?.floatEmbedding;
    return v ? Float32Array.from(v) : undefined;
  } catch (e) {
    resetVision();
    throw e;
  }
}

/** Find people only (no embedding), used to mask the user's own scene photo. */
export async function personMaskOf(canvas: HTMLCanvasElement) {
  const result = await detect(visionInput(canvas, DETECT_MAX));
  try {
    const masks = result.segmentationMasks ?? [];
    if (!masks.length) return null;
    const { width, height } = masks[0];
    const out = new Float32Array(width * height);
    for (const m of masks) {
      if (m.width !== width || m.height !== height) continue;
      const d = m.getAsFloat32Array();
      for (let k = 0; k < d.length; k++) if (d[k] > out[k]) out[k] = d[k];
    }
    return { data: out, width, height };
  } finally {
    result.close();
  }
}

async function detect(input: HTMLCanvasElement) {
  const landmarker = await getPoseLandmarker();
  try {
    return landmarker.detect(input);
  } catch (e) {
    // A wasm abort leaves the task unusable; load a fresh one next time.
    resetVision();
    throw e;
  }
}

/**
 * Canvas ready for MediaPipe: longest side at most `maxDim`, and a width that is
 * a multiple of 4. MediaPipe's CPU path aborts on other widths ("1 vs. 4" channel
 * check). The tiny stretch this causes does not matter: results are normalized.
 */
export function visionInput(src: HTMLCanvasElement, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(src.width, src.height));
  const w = Math.max(4, Math.round((src.width * scale) / 4) * 4);
  const h = Math.max(1, Math.round(src.height * scale));
  if (w === src.width && h === src.height) return src;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  return c;
}

function meanX(lms: Landmark[]): number {
  return lms.reduce((s, l) => s + l[0], 0) / Math.max(1, lms.length);
}

const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
