import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { engagementToMeta, MetaForm, metaToEngagement, type Meta } from '../components/MetaForm';
import { PoseOverlay } from '../components/PoseOverlay';
import { Button, Chip, Header, ViralBadge } from '../components/ui';
import { DEST_BY_ID } from '../data/destinations';
import { db, deletePose, PLATFORMS, type Pose } from '../db/db';
import { useObjectUrl, useViralScores } from '../lib/hooks';
import { formatCount } from '../lib/numbers';
import { navigate } from '../lib/router';

type View = 'photo' | 'outline' | 'skeleton';

export function PoseDetailPage({ id }: { id: string }) {
  const pose = useLiveQuery(() => db.poses.get(id), [id]);
  const image = useLiveQuery(() => db.images.get(id), [id]);
  const url = useObjectUrl(image?.blob ?? pose?.thumb);
  const viral = useViralScores().get(id);
  const [view, setView] = useState<View>('photo');
  const [editing, setEditing] = useState<Meta | null>(null);

  const back = () => (history.length > 1 ? history.back() : navigate('/library'));

  if (pose === undefined) return <Header title="…" onBack={back} />;
  if (pose === null) {
    return (
      <div>
        <Header title="Không tìm thấy" onBack={back} />
        <p className="p-6 text-neutral-400">Dáng này đã bị xoá.</p>
      </div>
    );
  }

  const dest = pose.destinationId ? DEST_BY_ID.get(pose.destinationId) : undefined;
  const platform = PLATFORMS.find((p) => p.id === pose.platform)?.label;
  const e = pose.engagement;

  const startEdit = () =>
    setEditing({
      platform: pose.platform,
      ...engagementToMeta(e),
      postedAt: pose.postedAt ?? '',
      destinationId: pose.destinationId ?? '',
      tags: pose.tags,
      note: pose.note ?? '',
    });

  const saveEdit = async () => {
    if (!editing) return;
    const patch: Partial<Pose> = {
      platform: editing.platform,
      engagement: metaToEngagement(editing),
      postedAt: editing.postedAt || undefined,
      destinationId: editing.destinationId || undefined,
      tags: editing.tags,
      note: editing.note.trim() || undefined,
    };
    await db.poses.update(id, patch);
    setEditing(null);
  };

  const remove = async () => {
    if (!confirm('Xoá dáng này khỏi thư viện?')) return;
    await deletePose(id);
    back();
  };

  return (
    <div className="pb-8">
      <Header
        title={dest?.name ?? 'Dáng mẫu'}
        onBack={back}
        right={
          <button
            type="button"
            className="px-2 text-2xl"
            aria-label="Yêu thích"
            onClick={() => db.poses.update(id, { favorite: pose.favorite ? 0 : 1 })}
          >
            {pose.favorite ? '★' : '☆'}
          </button>
        }
      />

      <div className="p-3">
        <div
          className="relative mx-auto overflow-hidden rounded-xl bg-neutral-900"
          style={{ aspectRatio: `${pose.width} / ${pose.height}`, width: `min(100%, calc(64vh * ${pose.width / pose.height}))` }}
        >
          {view !== 'outline' && url && <img src={url} alt="" className={`absolute inset-0 h-full w-full ${view === 'skeleton' ? 'opacity-40' : ''}`} />}
          <PoseOverlay
            people={pose.people}
            width={pose.width}
            height={pose.height}
            outline={view !== 'skeleton'}
            fill={view === 'outline'}
            skeleton={view === 'skeleton'}
            strokeScale={view === 'outline' ? 1.4 : 1}
          />
        </div>
        <div className="mt-3 flex justify-center gap-2">
          <Chip active={view === 'photo'} onClick={() => setView('photo')}>
            Ảnh + viền
          </Chip>
          <Chip active={view === 'outline'} onClick={() => setView('outline')}>
            Chỉ viền
          </Chip>
          <Chip active={view === 'skeleton'} onClick={() => setView('skeleton')}>
            Khung xương
          </Chip>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4 p-4">
          <MetaForm value={editing} onChange={setEditing} />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setEditing(null)}>Huỷ</Button>
            <Button variant="primary" onClick={saveEdit}>
              Lưu
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <ViralBadge score={viral} />
            <span className="text-neutral-300">{platform}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-300">
              {pose.peopleCount === 0 ? 'Không thấy người' : pose.peopleCount === 1 ? '1 người' : pose.peopleCount === 2 ? 'Cặp đôi' : `${pose.peopleCount} người`}
            </span>
            {pose.postedAt && <span className="text-neutral-500">· đăng {pose.postedAt}</span>}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['Like', e?.likes],
              ['Lưu', e?.saves],
              ['Bình luận', e?.comments],
              ['Chia sẻ', e?.shares],
            ].map(([label, n]) => (
              <div key={label as string} className="rounded-xl bg-neutral-900 py-2">
                <div className="text-base font-bold">{formatCount(n as number | undefined)}</div>
                <div className="text-[11px] text-neutral-500">{label}</div>
              </div>
            ))}
          </div>

          {dest && (
            <p className="text-sm text-neutral-300">
              📍 {dest.name} {dest.city !== 'generic' && <span className="text-neutral-500">{dest.zh}</span>}
            </p>
          )}
          {pose.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pose.tags.map((t) => (
                <span key={t} className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">
                  {t}
                </span>
              ))}
            </div>
          )}
          {pose.note && <p className="whitespace-pre-wrap rounded-xl bg-neutral-900 p-3 text-sm text-neutral-200">{pose.note}</p>}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button onClick={startEdit}>Sửa thông tin</Button>
            <Button variant="danger" onClick={remove}>
              Xoá
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
