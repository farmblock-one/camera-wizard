import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../db/db';
import { computeViralScores } from './viral';

/** Object URL for a Blob, revoked automatically. */
export function useObjectUrl(blob: Blob | undefined | null): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

/** Viral score (0–100) of every pose, recomputed when the library changes. */
export function useViralScores(): Map<string, number> {
  return (
    useLiveQuery(async () => {
      const rows: { id: string; platform: import('../db/db').Platform; engagement?: import('../db/db').Engagement; postedAt?: string }[] = [];
      await db.poses.each((p) => rows.push({ id: p.id, platform: p.platform, engagement: p.engagement, postedAt: p.postedAt }));
      return computeViralScores(rows);
    }) ?? new Map()
  );
}
