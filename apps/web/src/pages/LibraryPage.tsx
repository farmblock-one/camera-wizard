import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { DestinationSelect } from '../components/MetaForm';
import { PoseCard } from '../components/PoseCard';
import { Button, Chip, Header } from '../components/ui';
import { db, type Pose } from '../db/db';
import { useViralScores } from '../lib/hooks';
import { navigate, type Route } from '../lib/router';

export type PeopleFilter = 'all' | '1' | '2' | '3+';

export function matchesPeople(p: Pose, f: PeopleFilter): boolean {
  if (f === 'all') return true;
  if (f === '1') return p.peopleCount === 1;
  if (f === '2') return p.peopleCount === 2;
  return p.peopleCount >= 3;
}

export const PEOPLE_FILTERS: { id: PeopleFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: '1', label: '1 người' },
  { id: '2', label: 'Cặp đôi' },
  { id: '3+', label: 'Nhóm' },
];

export function LibraryPage({ route }: { route: Route }) {
  const poses = useLiveQuery(() => db.poses.toArray());
  const viral = useViralScores();
  const [people, setPeople] = useState<PeopleFilter>('all');
  const [dest, setDest] = useState(route.query.get('dest') ?? '');
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState<'viral' | 'new'>('viral');

  const list = useMemo(() => {
    if (!poses) return [];
    const out = poses.filter((p) => matchesPeople(p, people) && (!dest || p.destinationId === dest) && (!favOnly || p.favorite === 1));
    if (sort === 'new') out.sort((a, b) => b.createdAt - a.createdAt);
    else out.sort((a, b) => (viral.get(b.id) ?? -1) - (viral.get(a.id) ?? -1) || b.createdAt - a.createdAt);
    return out;
  }, [poses, viral, people, dest, favOnly, sort]);

  return (
    <div>
      <Header
        title={`Thư viện${poses ? ` (${poses.length})` : ''}`}
        right={
          <Button variant="primary" className="py-1.5" onClick={() => navigate('/import')}>
            + Thêm
          </Button>
        }
      />
      <div className="space-y-2 border-b border-neutral-900 p-3">
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3">
          {PEOPLE_FILTERS.map((f) => (
            <Chip key={f.id} active={people === f.id} onClick={() => setPeople(f.id)}>
              {f.label}
            </Chip>
          ))}
          <Chip active={favOnly} onClick={() => setFavOnly(!favOnly)}>
            ★ Yêu thích
          </Chip>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <DestinationSelect value={dest} onChange={setDest} allLabel="Mọi địa điểm" />
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl bg-neutral-900 px-3 text-sm text-neutral-300"
            onClick={() => setSort(sort === 'viral' ? 'new' : 'viral')}
          >
            {sort === 'viral' ? '🔥 Viral' : '🕒 Mới nhất'}
          </button>
        </div>
      </div>

      {poses && poses.length === 0 ? (
        <div className="space-y-3 p-6 text-center text-neutral-400">
          <p>Chưa có dáng mẫu nào.</p>
          <Button variant="primary" onClick={() => navigate('/import')}>
            Thêm ảnh đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
          {list.map((p) => (
            <PoseCard key={p.id} pose={p} viral={viral.get(p.id)} />
          ))}
          {poses && list.length === 0 && <p className="col-span-full p-6 text-center text-sm text-neutral-500">Không có dáng nào khớp bộ lọc.</p>}
        </div>
      )}
    </div>
  );
}
