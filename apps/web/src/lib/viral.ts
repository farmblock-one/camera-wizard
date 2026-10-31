import type { Engagement, Platform } from '../db/db';

export interface ViralInput {
  id: string;
  platform: Platform;
  engagement?: Engagement;
  postedAt?: string;
}

/**
 * Raw strength of a post. Saves count most: people save a post to copy the pose.
 * Returns null when there are no numbers at all.
 */
export function rawViral(e?: Engagement): number | null {
  if (!e) return null;
  const { likes, saves, comments, shares } = e;
  if (likes == null && saves == null && comments == null && shares == null) return null;
  const total = (likes ?? 0) + 3 * (saves ?? 0) + 2 * (comments ?? 0) + 2 * (shares ?? 0);
  return Math.log10(1 + total);
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Absolute scale: ~100 interactions → 0, ~1M → 1. */
function absoluteScore(raw: number): number {
  return clamp01((raw - 2) / 4);
}

const RECENT_MS = 365 * 24 * 3600 * 1000;
const MIN_PEERS = 5;

/**
 * Score 0–100 per pose. Platforms have very different scales (Douyin vs Instagram),
 * so once a platform has enough posts the score blends the rank within that platform
 * with an absolute scale. Posts from the last 12 months get a small bonus.
 */
export function computeViralScores(items: ViralInput[], now = Date.now()): Map<string, number> {
  const byPlatform = new Map<Platform, { id: string; raw: number; postedAt?: string }[]>();
  for (const it of items) {
    const raw = rawViral(it.engagement);
    if (raw == null) continue;
    const list = byPlatform.get(it.platform) ?? [];
    list.push({ id: it.id, raw, postedAt: it.postedAt });
    byPlatform.set(it.platform, list);
  }

  const scores = new Map<string, number>();
  for (const list of byPlatform.values()) {
    const n = list.length;
    for (const it of list) {
      const abs = absoluteScore(it.raw);
      let s = abs;
      if (n >= MIN_PEERS) {
        let below = 0;
        let ties = 0;
        for (const o of list) {
          if (o === it) continue;
          if (o.raw < it.raw) below++;
          else if (o.raw === it.raw) ties++;
        }
        const pct = (below + ties / 2) / (n - 1);
        s = 0.5 * pct + 0.5 * abs;
      }
      let score = Math.round(100 * s);
      if (it.postedAt) {
        const t = Date.parse(it.postedAt);
        if (Number.isFinite(t) && now - t <= RECENT_MS) score += 5;
      }
      scores.set(it.id, Math.min(100, score));
    }
  }
  return scores;
}
