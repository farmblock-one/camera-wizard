import Dexie, { type EntityTable } from 'dexie';

export type Platform = 'xiaohongshu' | 'douyin' | 'tiktok' | 'instagram' | 'other';

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'xiaohongshu', label: '小红书' },
  { id: 'douyin', label: '抖音' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'other', label: 'Khác' },
];

export interface Engagement {
  likes?: number;
  saves?: number;
  comments?: number;
  shares?: number;
}

/** [x, y] normalized to the image (0–1). */
export type Point = [number, number];
/** [x, y, visibility] normalized; 33 MediaPipe pose landmarks. */
export type Landmark = [number, number, number];

export interface PersonPose {
  outline: Point[];
  landmarks: Landmark[];
}

export interface Pose {
  id: string;
  thumb: Blob;
  width: number;
  height: number;
  people: PersonPose[];
  peopleCount: number;
  platform: Platform;
  engagement?: Engagement;
  /** yyyy-mm-dd */
  postedAt?: string;
  destinationId?: string;
  tags: string[];
  note?: string;
  favorite: 0 | 1;
  /** Image embedding of the background (people greyed out), L2-normalized. */
  sceneEmbedding?: Float32Array;
  createdAt: number;
}

/** Full-size image kept apart so lists stay light. */
export interface PoseImage {
  id: string;
  blob: Blob;
}

export const db = new Dexie('camera-wizard') as Dexie & {
  poses: EntityTable<Pose, 'id'>;
  images: EntityTable<PoseImage, 'id'>;
};

db.version(1).stores({
  poses: 'id, platform, destinationId, peopleCount, favorite, createdAt, *tags',
  images: 'id',
});

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function deletePose(id: string) {
  await db.transaction('rw', db.poses, db.images, async () => {
    await db.poses.delete(id);
    await db.images.delete(id);
  });
}
