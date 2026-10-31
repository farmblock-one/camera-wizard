export interface Candidate {
  id: string;
  sceneEmbedding?: Float32Array;
  destinationId?: string;
}

export interface Ranked {
  id: string;
  /** Raw cosine similarity of the backgrounds (0–1 for these embeddings). */
  similarity: number;
  score: number;
}

const W_SCENE = 0.7;
const W_VIRAL = 0.3;
const DEST_BONUS = 0.2;
const DEFAULT_VIRAL = 30;

export function cosine(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * Rank poses for a scene photo: how alike the backgrounds look (scaled to the
 * candidates at hand), plus how viral the post was, plus a bonus for the chosen place.
 */
export function rankForScene(
  candidates: Candidate[],
  scene: Float32Array,
  viral: Map<string, number>,
  opts: { destinationId?: string } = {},
): Ranked[] {
  const sims = candidates.map((c) => (c.sceneEmbedding ? cosine(c.sceneEmbedding, scene) : null));
  const valid = sims.filter((s): s is number => s != null);
  const lo = valid.length ? Math.min(...valid) : 0;
  const hi = valid.length ? Math.max(...valid) : 1;
  const span = hi - lo;

  return candidates
    .map((c, i) => {
      const sim = sims[i];
      const simNorm = sim == null ? 0 : span < 1e-6 ? 1 : (sim - lo) / span;
      const v = (viral.get(c.id) ?? DEFAULT_VIRAL) / 100;
      const bonus = opts.destinationId && c.destinationId === opts.destinationId ? DEST_BONUS : 0;
      return { id: c.id, similarity: sim ?? 0, score: W_SCENE * simNorm + W_VIRAL * v + bonus };
    })
    .sort((a, b) => b.score - a.score);
}
