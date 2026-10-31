import { describe, expect, it } from 'vitest';
import { cosine, rankForScene } from '../lib/rank';

const v = (...xs: number[]) => Float32Array.from(xs);

describe('cosine', () => {
  it('works', () => {
    expect(cosine(v(1, 0), v(1, 0))).toBeCloseTo(1);
    expect(cosine(v(1, 0), v(0, 1))).toBeCloseTo(0);
    expect(cosine(v(1, 0), v(1))).toBe(0);
  });
});

describe('rankForScene', () => {
  const scene = v(1, 0, 0);
  const cands = [
    { id: 'same', sceneEmbedding: v(1, 0, 0) },
    { id: 'near', sceneEmbedding: v(0.8, 0.6, 0) },
    { id: 'far', sceneEmbedding: v(0, 0, 1) },
    { id: 'none' },
  ];

  it('puts the most similar scene first', () => {
    const r = rankForScene(cands, scene, new Map());
    expect(r.map((x) => x.id)).toEqual(['same', 'near', 'far', 'none']);
    expect(r[0].similarity).toBeCloseTo(1);
  });

  it('lets virality break near-ties and the chosen place win', () => {
    const viral = new Map([['near', 100], ['same', 0]]);
    const r1 = rankForScene(cands.slice(0, 2), scene, viral);
    expect(r1[0].id).toBe('same');
    const r2 = rankForScene(
      [{ id: 'a', sceneEmbedding: v(1, 0, 0) }, { id: 'b', sceneEmbedding: v(0.9, 0.1, 0), destinationId: 'x' }, { id: 'c', sceneEmbedding: v(0, 1, 0) }],
      scene,
      new Map(),
      { destinationId: 'x' },
    );
    expect(r2[0].id).toBe('b');
  });
});
