import { describe, expect, it } from 'vitest';
import { computeViralScores, rawViral } from '../lib/viral';

const NOW = Date.parse('2026-10-31');

describe('rawViral', () => {
  it('returns null without numbers', () => {
    expect(rawViral(undefined)).toBeNull();
    expect(rawViral({})).toBeNull();
  });
  it('weights saves above likes', () => {
    expect(rawViral({ saves: 1000 })!).toBeGreaterThan(rawViral({ likes: 1000 })!);
  });
});

describe('computeViralScores', () => {
  it('uses absolute scale for small platforms', () => {
    const s = computeViralScores(
      [
        { id: 'a', platform: 'instagram', engagement: { likes: 100 } },
        { id: 'b', platform: 'instagram', engagement: { likes: 1_000_000 } },
      ],
      NOW,
    );
    expect(s.get('a')).toBe(0);
    expect(s.get('b')).toBe(100);
  });

  it('ranks within a platform once it has enough posts', () => {
    const items = [1e3, 1e4, 1e5, 1e6, 1e7].map((likes, i) => ({
      id: `d${i}`,
      platform: 'douyin' as const,
      engagement: { likes },
    }));
    const s = computeViralScores(items, NOW);
    const vals = items.map((i) => s.get(i.id)!);
    expect([...vals].sort((a, b) => a - b)).toEqual(vals);
    expect(vals[4]).toBe(100);
  });

  it('gives a bonus to recent posts and skips posts without numbers', () => {
    const s = computeViralScores(
      [
        { id: 'old', platform: 'tiktok', engagement: { likes: 10_000 }, postedAt: '2024-01-01' },
        { id: 'new', platform: 'tiktok', engagement: { likes: 10_000 }, postedAt: '2026-06-01' },
        { id: 'none', platform: 'tiktok' },
      ],
      NOW,
    );
    expect(s.get('new')! - s.get('old')!).toBe(5);
    expect(s.has('none')).toBe(false);
  });
});
