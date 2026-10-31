import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState } from 'react';
import { DestinationSelect } from '../components/MetaForm';
import { PoseCard } from '../components/PoseCard';
import { Button, Chip, Header, Spinner } from '../components/ui';
import { db } from '../db/db';
import { useObjectUrl, useViralScores } from '../lib/hooks';
import { cropToCanvas, FULL_CROP, loadImage } from '../lib/image';
import { rankForScene } from '../lib/rank';
import { errorMessage } from '../lib/errors';
import { navigate } from '../lib/router';
import { embedScene, personMaskOf } from '../vision/analyze';
import { matchesPeople, PEOPLE_FILTERS, type PeopleFilter } from './LibraryPage';

const MAX_RESULTS = 12;

export function SuggestPage() {
  const poses = useLiveQuery(() => db.poses.toArray());
  const viral = useViralScores();
  const [photo, setPhoto] = useState<File | null>(null);
  const [scene, setScene] = useState<Float32Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<PeopleFilter>('all');
  const [dest, setDest] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const photoUrl = useObjectUrl(photo);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setPhoto(file);
    setScene(null);
    setError(null);
    setBusy(true);
    try {
      const img = await loadImage(file);
      const canvas = cropToCanvas(img, FULL_CROP, 1024);
      // If someone is in the shot, grey them out so only the place is compared.
      const mask = await personMaskOf(canvas);
      const emb = await embedScene(canvas, mask?.data ?? null, mask?.width, mask?.height);
      if (!emb) throw new Error('Không phân tích được ảnh');
      setScene(emb);
    } catch (e) {
      console.error(e);
      setError(`Lỗi: ${errorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const results = useMemo(() => {
    if (!poses) return [];
    const pool = poses.filter((p) => matchesPeople(p, people) && p.peopleCount > 0);
    const byId = new Map(pool.map((p) => [p.id, p]));
    if (scene) {
      return rankForScene(pool, scene, viral, { destinationId: dest || undefined })
        .slice(0, MAX_RESULTS)
        .map((r) => ({ pose: byId.get(r.id)!, label: `giống ${Math.round(r.similarity * 100)}%` }));
    }
    if (dest) {
      // No scene photo yet: best poses of the chosen place by virality.
      return pool
        .filter((p) => p.destinationId === dest)
        .sort((a, b) => (viral.get(b.id) ?? -1) - (viral.get(a.id) ?? -1))
        .slice(0, MAX_RESULTS)
        .map((pose) => ({ pose, label: undefined }));
    }
    return [];
  }, [poses, people, scene, viral, dest]);

  const empty = poses && poses.length === 0;

  return (
    <div>
      <Header title="Gợi ý dáng" />
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      <div className="space-y-3 p-3">
        {empty ? (
          <div className="space-y-3 rounded-xl bg-neutral-900 p-4 text-sm text-neutral-300">
            <p>Thư viện đang trống. Hãy thêm ảnh mẫu từ 小红书 / 抖音 / TikTok / Instagram trước, rồi quay lại đây để được gợi ý.</p>
            <Button variant="primary" onClick={() => navigate('/import')}>
              Thêm ảnh mẫu
            </Button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900"
              style={{ minHeight: photoUrl ? undefined : 140 }}
            >
              {photoUrl ? (
                <>
                  <img src={photoUrl} alt="" className="max-h-56 w-full object-cover" />
                  <span className="absolute bottom-2 right-2 rounded-lg bg-neutral-950/80 px-2 py-1 text-xs">Đổi ảnh</span>
                </>
              ) : (
                <span className="px-6 py-8 text-center text-sm text-neutral-300">
                  📷 <b>Chụp khung cảnh</b> bằng Camera iPhone,
                  <br />
                  rồi bấm vào đây để chọn ảnh đó
                </span>
              )}
            </button>

            <div className="-mx-3 flex gap-2 overflow-x-auto px-3">
              {PEOPLE_FILTERS.map((f) => (
                <Chip key={f.id} active={people === f.id} onClick={() => setPeople(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            <DestinationSelect value={dest} onChange={setDest} allLabel="Đang ở đâu? (không bắt buộc)" />
          </>
        )}

        {busy && <Spinner label="Đang xem khung cảnh… (lần đầu cần tải AI)" />}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
          {results.map(({ pose, label }) => (
            <PoseCard key={pose.id} pose={pose} viral={viral.get(pose.id)} extra={label} />
          ))}
        </div>
      )}
      {!busy && !empty && (scene || dest) && results.length === 0 && (
        <p className="p-6 text-center text-sm text-neutral-500">Chưa có dáng nào phù hợp bộ lọc.</p>
      )}
    </div>
  );
}
