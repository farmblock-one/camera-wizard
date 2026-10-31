import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Header } from '../components/ui';
import { CITIES, DESTINATIONS } from '../data/destinations';
import { db } from '../db/db';
import { navigate } from '../lib/router';

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function useOfflineStatus() {
  const [s, setS] = useState<{ ready: boolean; persisted?: boolean; usedMB?: number; standalone: boolean }>({
    ready: false,
    standalone: false,
  });
  useEffect(() => {
    (async () => {
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      let ready = false;
      try {
        // Workbox stores precached files with a revision query, so ignore the search part.
        ready = !!(await caches.match(`${import.meta.env.BASE_URL}models/pose_landmarker_full.task`, { ignoreSearch: true }));
      } catch {
        /* no Cache API */
      }
      const persisted = await navigator.storage?.persisted?.().catch(() => undefined);
      const est = await navigator.storage?.estimate?.().catch(() => undefined);
      setS({ ready, persisted, standalone, usedMB: est?.usage != null ? Math.round(est.usage / 1e6) : undefined });
    })();
  }, []);
  return s;
}

export function PlacesPage() {
  const counts = useLiveQuery(async () => {
    const m = new Map<string, number>();
    await db.poses.each((p) => p.destinationId && m.set(p.destinationId, (m.get(p.destinationId) ?? 0) + 1));
    return m;
  });
  const status = useOfflineStatus();
  const [copied, setCopied] = useState<string | null>(null);

  const onCopy = async (k: string) => {
    if (await copy(k)) {
      setCopied(k);
      setTimeout(() => setCopied((c) => (c === k ? null : c)), 1500);
    }
  };

  return (
    <div className="pb-6">
      <Header title="Địa điểm" />

      <div className="m-3 space-y-1.5 rounded-xl bg-neutral-900 p-3 text-sm">
        <div className="font-semibold">Chế độ offline</div>
        <div className={status.ready ? 'text-green-400' : 'text-orange-400'}>
          {status.ready ? '✓ AI đã tải về máy, dùng được khi không có mạng' : '… AI chưa tải xong. Mở app khi có Wi-Fi một lúc.'}
        </div>
        {!status.standalone && (
          <div className="text-orange-400">
            ⚠️ Hãy cài app: Safari → nút Chia sẻ → “Thêm vào MH chính”. Nếu không, iOS có thể xoá dữ liệu.
          </div>
        )}
        {status.usedMB != null && <div className="text-neutral-500">Đang dùng ~{status.usedMB} MB bộ nhớ</div>}
      </div>

      <p className="px-4 text-xs text-neutral-500">Chạm vào từ khoá để copy, rồi dán vào ô tìm kiếm của 小红书 / 抖音 / TikTok / Instagram.</p>

      {CITIES.map((city) => (
        <section key={city.id} className="mt-4">
          <h2 className="px-4 pb-2 text-base font-bold">
            {city.name} {city.zh && <span className="font-normal text-neutral-500">{city.zh}</span>}
          </h2>
          <div className="space-y-2 px-3">
            {DESTINATIONS.filter((d) => d.city === city.id).map((d) => {
              const n = counts?.get(d.id) ?? 0;
              return (
                <div key={d.id} className="rounded-xl bg-neutral-900 p-3">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{d.name}</div>
                      {d.city !== 'generic' && <div className="text-xs text-neutral-500">{d.zh}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/library?dest=${d.id}`)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${n ? 'bg-yellow-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}
                    >
                      {n} dáng
                    </button>
                    <button type="button" onClick={() => navigate(`/import?dest=${d.id}`)} className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs">
                      + Thêm
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.keywords.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onCopy(k)}
                        className={`rounded-full px-2.5 py-1 text-xs ${copied === k ? 'bg-green-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}
                      >
                        {copied === k ? 'Đã copy ✓' : k}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
