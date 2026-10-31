import { describe, expect, it } from 'vitest';
import { keepLargestComponent, maskToOutline, simplify, traceBoundary } from '../vision/outline';

function gridFrom(rows: string[]) {
  const h = rows.length;
  const w = rows[0].length;
  const grid = new Uint8Array(w * h);
  rows.forEach((r, y) => [...r].forEach((c, x) => (grid[y * w + x] = c === '#' ? 1 : 0)));
  return { grid, w, h };
}

describe('traceBoundary', () => {
  it('traces a filled square border once', () => {
    const { grid, w, h } = gridFrom(['.....', '.###.', '.###.', '.###.', '.....']);
    const b = traceBoundary(grid, w, h);
    expect(b).toHaveLength(8);
    expect(new Set(b.map((p) => p.join())).size).toBe(8);
    expect(b.map((p) => p.join())).not.toContain('2,2');
  });

  it('handles an L shape and a single pixel', () => {
    const L = gridFrom(['#..', '#..', '###']);
    const lb = traceBoundary(L.grid, L.w, L.h);
    // 1-pixel-wide arms are walked out and back.
    expect(lb).toHaveLength(7);
    expect(new Set(lb.map((p) => p.join())).size).toBe(5);
    const one = gridFrom(['...', '.#.', '...']);
    expect(traceBoundary(one.grid, one.w, one.h)).toEqual([[1, 1]]);
  });

  it('terminates on a one-pixel-wide line', () => {
    const { grid, w, h } = gridFrom(['#####']);
    const b = traceBoundary(grid, w, h);
    expect(b.length).toBeGreaterThanOrEqual(5);
    expect(b.length).toBeLessThanOrEqual(9);
  });
});

describe('keepLargestComponent', () => {
  it('drops small blobs', () => {
    const { grid, w, h } = gridFrom(['##...', '##..#', '.....']);
    expect(keepLargestComponent(grid, w, h)).toBe(4);
    expect(grid[1 * w + 4]).toBe(0);
  });
});

describe('simplify', () => {
  it('removes collinear points', () => {
    expect(simplify([[0, 0], [1, 0], [2, 0], [3, 0]], 0.5)).toEqual([[0, 0], [3, 0]]);
  });
});

describe('maskToOutline', () => {
  it('outlines a disc inside its bounds, normalized', () => {
    const W = 300;
    const H = 400;
    const data = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if ((x - 150) ** 2 + (y - 200) ** 2 < 100 ** 2) data[y * W + x] = 1;
    const out = maskToOutline({ data, width: W, height: H });
    expect(out.length).toBeGreaterThan(12);
    for (const [x, y] of out) {
      const r = Math.hypot(x * W - 150, y * H - 200);
      expect(r).toBeGreaterThan(85);
      expect(r).toBeLessThan(108);
    }
  });

  it('returns [] for an empty mask', () => {
    expect(maskToOutline({ data: new Float32Array(100), width: 10, height: 10 })).toEqual([]);
  });
});
