// Turn a person segmentation mask into a smooth outline polygon.
// Steps: downsample → keep largest blob → trace its border → simplify → smooth.

export type Pt = [number, number];

export interface MaskLike {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

/** Downsample a float mask to a binary grid whose longest side is at most `maxDim`. */
export function binarize(mask: MaskLike, threshold = 0.5, maxDim = 200) {
  const { data, width, height } = mask;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const gw = Math.max(1, Math.round(width * scale));
  const gh = Math.max(1, Math.round(height * scale));
  const grid = new Uint8Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    const sy = Math.min(height - 1, Math.floor(((y + 0.5) * height) / gh));
    for (let x = 0; x < gw; x++) {
      const sx = Math.min(width - 1, Math.floor(((x + 0.5) * width) / gw));
      grid[y * gw + x] = data[sy * width + sx] >= threshold ? 1 : 0;
    }
  }
  return { grid, w: gw, h: gh };
}

/** Keep only the largest 4-connected blob. Returns its pixel count. */
export function keepLargestComponent(grid: Uint8Array, w: number, h: number): number {
  const label = new Int32Array(w * h);
  let best = 0;
  let bestSize = 0;
  let next = 0;
  const stack: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i] || label[i]) continue;
    next++;
    let size = 0;
    label[i] = next;
    stack.push(i);
    while (stack.length) {
      const p = stack.pop()!;
      size++;
      const x = p % w;
      const y = (p - x) / w;
      const nbrs = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nbrs) {
        if (q >= 0 && grid[q] && !label[q]) {
          label[q] = next;
          stack.push(q);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = next;
    }
  }
  for (let i = 0; i < grid.length; i++) grid[i] = label[i] === best && best > 0 ? 1 : 0;
  return bestSize;
}

// Clockwise neighbours (y grows downward), starting from west.
const DIRS: Pt[] = [
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
];

function dirIndex(dx: number, dy: number): number {
  return DIRS.findIndex(([x, y]) => x === dx && y === dy);
}

/** Moore-neighbour tracing of the outer border of the blob. Pixel coordinates. */
export function traceBoundary(grid: Uint8Array, w: number, h: number): Pt[] {
  const fg = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && grid[y * w + x] === 1;

  let start: Pt | null = null;
  for (let i = 0; i < grid.length && !start; i++) if (grid[i]) start = [i % w, Math.floor(i / w)];
  if (!start) return [];

  const boundary: Pt[] = [start];
  let c: Pt = start;
  let b: Pt = [start[0] - 1, start[1]];
  let second: Pt | null = null;
  const maxSteps = 4 * w * h + 8;

  for (let step = 0; step < maxSteps; step++) {
    const k = dirIndex(b[0] - c[0], b[1] - c[1]);
    let found: Pt | null = null;
    let newB: Pt = b;
    for (let i = 1; i <= 8; i++) {
      const idx = (k + i) % 8;
      const n: Pt = [c[0] + DIRS[idx][0], c[1] + DIRS[idx][1]];
      if (fg(n[0], n[1])) {
        found = n;
        const prev = DIRS[(idx + 7) % 8];
        newB = [c[0] + prev[0], c[1] + prev[1]];
        break;
      }
    }
    if (!found) break; // single isolated pixel

    // Stop once we leave the start pixel the same way we did the first time.
    if (second && c[0] === start[0] && c[1] === start[1] && found[0] === second[0] && found[1] === second[1]) break;
    if (!second) second = found;

    c = found;
    b = newB;
    if (!(c[0] === start[0] && c[1] === start[1])) boundary.push(c);
  }
  return boundary;
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

/** Ramer–Douglas–Peucker on an open polyline. */
export function simplify(points: Pt[], epsilon: number): Pt[] {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(points[i], points[s], points[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx >= 0 && maxD > epsilon) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Chaikin corner cutting on a closed polygon. */
export function smoothClosed(points: Pt[], iterations = 2): Pt[] {
  let pts = points;
  for (let it = 0; it < iterations && pts.length >= 3; it++) {
    const out: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      out.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]]);
      out.push([0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]);
    }
    pts = out;
  }
  return pts;
}

/**
 * Full pipeline. Returns the outline in normalized image coordinates (0–1),
 * or [] when the mask holds no usable person.
 */
export function maskToOutline(mask: MaskLike, opts: { threshold?: number; maxDim?: number; minArea?: number } = {}): Pt[] {
  const { grid, w, h } = binarize(mask, opts.threshold ?? 0.5, opts.maxDim ?? 200);
  const area = keepLargestComponent(grid, w, h);
  if (area < (opts.minArea ?? 0.002) * w * h || area < 4) return [];
  const border = traceBoundary(grid, w, h);
  if (border.length < 3) return [];
  const simple = simplify([...border, border[0]], 0.8).slice(0, -1);
  const smooth = smoothClosed(simple, 2);
  return smooth.map(([x, y]) => [round4((x + 0.5) / w), round4((y + 0.5) / h)]);
}

const round4 = (x: number) => Math.round(x * 1e4) / 1e4;
