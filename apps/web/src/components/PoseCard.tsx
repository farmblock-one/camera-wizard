import type { Pose } from '../db/db';
import { PLATFORMS } from '../db/db';
import { DEST_BY_ID } from '../data/destinations';
import { useObjectUrl } from '../lib/hooks';
import { navigate } from '../lib/router';
import { PoseOverlay } from './PoseOverlay';
import { ViralBadge } from './ui';

export function PoseCard({ pose, viral, extra }: { pose: Pose; viral?: number; extra?: string }) {
  const url = useObjectUrl(pose.thumb);
  const dest = pose.destinationId ? DEST_BY_ID.get(pose.destinationId) : undefined;
  const platform = PLATFORMS.find((p) => p.id === pose.platform)?.label;
  return (
    <button
      type="button"
      onClick={() => navigate(`/pose/${pose.id}`)}
      className="flex w-full flex-col self-start overflow-hidden rounded-xl bg-neutral-900 text-left"
    >
      <div className="relative aspect-[3/4] w-full bg-neutral-950">
        {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />}
        <PoseOverlay people={pose.people} width={pose.width} height={pose.height} fit="contain" className="opacity-80" />
        <div className="absolute left-1.5 top-1.5 flex gap-1">
          <ViralBadge score={viral} />
          {pose.favorite === 1 && <span className="rounded-md bg-neutral-950/70 px-1.5 py-0.5 text-[11px]">★</span>}
        </div>
        {extra && (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-neutral-950/80 px-1.5 py-0.5 text-[11px] font-semibold text-yellow-300">{extra}</span>
        )}
      </div>
      <div className="px-2 py-1.5 text-[11px] leading-tight text-neutral-400">
        <div className="truncate text-neutral-200">{dest?.name ?? 'Chưa gán địa điểm'}</div>
        <div className="truncate">
          {pose.peopleCount === 0 ? 'Không thấy người' : pose.peopleCount === 1 ? '1 người' : pose.peopleCount === 2 ? 'Cặp đôi' : `${pose.peopleCount} người`}
          {platform ? ` · ${platform}` : ''}
        </div>
      </div>
    </button>
  );
}
