import { useEffect, useRef, useState } from 'react';
import { CropEditor } from '../components/CropEditor';
import { EMPTY_META, MetaForm, metaToEngagement, type Meta } from '../components/MetaForm';
import { PoseOverlay } from '../components/PoseOverlay';
import { Button, Header, Spinner } from '../components/ui';
import { db, newId } from '../db/db';
import { useObjectUrl } from '../lib/hooks';
import { canvasToBlob, cropToCanvas, FULL_CROP, loadImage, sizeOf, type CropRect, type Drawable } from '../lib/image';
import { errorMessage } from '../lib/errors';
import { navigate, type Route } from '../lib/router';
import { analyzeImage, type Analysis } from '../vision/analyze';

const IMAGE_MAX = 1600;
const THUMB_MAX = 480;

interface Loaded {
  img: Drawable;
  width: number;
  height: number;
}

interface Result {
  canvas: HTMLCanvasElement;
  blob: Blob;
  analysis: Analysis;
}

export function ImportPage({ route }: { route: Route }) {
  const [files, setFiles] = useState<File[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [crop, setCrop] = useState<CropRect>(FULL_CROP);
  const [meta, setMeta] = useState<Meta>(() => ({ ...EMPTY_META, destinationId: route.query.get('dest') ?? '' }));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const file = files[index];
  const fileUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result?.blob);

  useEffect(() => {
    if (!file) return;
    let alive = true;
    setLoaded(null);
    setResult(null);
    setError(null);
    setCrop(FULL_CROP);
    loadImage(file)
      .then((img) => alive && setLoaded({ img, ...sizeOf(img) }))
      .catch(() => alive && setError('Không đọc được ảnh này. Bỏ qua và chọn ảnh khác.'));
    return () => {
      alive = false;
    };
  }, [file]);

  const pick = (list: FileList | null) => {
    if (!list?.length) return;
    setFiles(Array.from(list));
    setIndex(0);
    setSaved(0);
  };

  const next = () => {
    // Keep platform + place (often a batch from the same search), reset the rest.
    setMeta((m) => ({ ...EMPTY_META, platform: m.platform, destinationId: m.destinationId }));
    setIndex((i) => i + 1);
  };

  const analyze = async () => {
    if (!loaded) return;
    setError(null);
    setBusy('Đang tách dáng… (lần đầu cần tải AI, chờ chút)');
    try {
      const canvas = cropToCanvas(loaded.img, crop, IMAGE_MAX);
      const analysis = await analyzeImage(canvas);
      const blob = await canvasToBlob(canvas);
      setResult({ canvas, blob, analysis });
    } catch (e) {
      console.error(e);
      setError(`Lỗi khi phân tích ảnh: ${errorMessage(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!result) return;
    setBusy('Đang lưu…');
    try {
      const { canvas, blob, analysis } = result;
      const thumb = await canvasToBlob(cropToCanvas(canvas, FULL_CROP, THUMB_MAX), 0.8);
      const id = newId();
      await db.transaction('rw', db.poses, db.images, async () => {
        await db.images.add({ id, blob });
        await db.poses.add({
          id,
          thumb,
          width: canvas.width,
          height: canvas.height,
          people: analysis.people,
          peopleCount: analysis.people.length,
          platform: meta.platform,
          engagement: metaToEngagement(meta),
          postedAt: meta.postedAt || undefined,
          destinationId: meta.destinationId || undefined,
          tags: meta.tags,
          note: meta.note.trim() || undefined,
          favorite: 0,
          sceneEmbedding: analysis.sceneEmbedding,
          createdAt: Date.now(),
        });
      });
      setSaved((n) => n + 1);
      next();
    } catch (e) {
      setError(`Không lưu được: ${errorMessage(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const picker = (
    <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
  );

  // 1) Nothing picked yet, or the batch is finished.
  if (!file) {
    const done = files.length > 0;
    return (
      <div>
        <Header title="Thêm dáng mẫu" />
        {picker}
        <div className="space-y-5 p-4">
          {done && (
            <div className="rounded-xl border border-green-700 bg-green-950/50 p-4 text-sm">
              ✅ Đã lưu {saved}/{files.length} ảnh.{' '}
              <button type="button" className="font-semibold text-yellow-300 underline" onClick={() => navigate('/library')}>
                Xem thư viện
              </button>
            </div>
          )}
          <Button variant="primary" className="w-full py-4 text-base" onClick={() => input.current?.click()}>
            Chọn ảnh chụp màn hình
          </Button>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-400">
            <li>Lướt 小红书 / 抖音 / TikTok / Instagram, tìm bài hot (từ khoá có ở tab Địa điểm).</li>
            <li>Chụp màn hình bài viết, nhớ lấy cả phần có số like / lưu.</li>
            <li>Chọn nhiều ảnh một lúc ở đây. Mỗi ảnh: crop lấy phần ảnh, nhập số liệu, app tự tách dáng.</li>
          </ol>
        </div>
      </div>
    );
  }

  const title = `Ảnh ${index + 1}/${files.length}`;

  // 3) Review the detected pose before saving.
  if (result && resultUrl) {
    const n = result.analysis.people.length;
    return (
      <div className="pb-6">
        <Header title={title} onBack={() => setResult(null)} />
        <div className="space-y-4 p-4">
          <div
            className="relative mx-auto overflow-hidden rounded-lg"
            style={{ aspectRatio: `${result.canvas.width} / ${result.canvas.height}`, width: `min(100%, calc(60vh * ${result.canvas.width / result.canvas.height}))` }}
          >
            <img src={resultUrl} alt="" className="absolute inset-0 h-full w-full" />
            <PoseOverlay people={result.analysis.people} width={result.canvas.width} height={result.canvas.height} skeleton />
          </div>
          <p className={`text-center text-sm ${n ? 'text-neutral-300' : 'text-orange-400'}`}>
            {n === 0
              ? '⚠️ Không thấy người trong ảnh. Thử crop sát hơn, hoặc vẫn lưu (sẽ không có viền).'
              : n === 1
                ? 'Tìm thấy 1 người.'
                : `Tìm thấy ${n} người.`}
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setResult(null)} disabled={!!busy}>
              Crop lại
            </Button>
            <Button variant="primary" onClick={save} disabled={!!busy}>
              {index + 1 < files.length ? 'Lưu & ảnh tiếp' : 'Lưu'}
            </Button>
          </div>
          {busy && <Spinner label={busy} />}
        </div>
      </div>
    );
  }

  // 2) Crop + details.
  return (
    <div className="pb-6">
      <Header
        title={title}
        right={
          <Button variant="ghost" onClick={next} disabled={!!busy}>
            Bỏ qua
          </Button>
        }
      />
      <div className="space-y-4 p-4">
        {loaded && fileUrl ? (
          <>
            <CropEditor url={fileUrl} width={loaded.width} height={loaded.height} value={crop} onChange={setCrop} />
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Kéo khung / góc để chỉ lấy phần ảnh (bỏ chữ, nút của app).</span>
              <button type="button" className="shrink-0 pl-2 text-yellow-300" onClick={() => setCrop(FULL_CROP)}>
                Toàn ảnh
              </button>
            </div>
          </>
        ) : (
          !error && <Spinner label="Đang mở ảnh…" />
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <MetaForm value={meta} onChange={setMeta} />
        <Button variant="primary" className="w-full py-3.5 text-base" onClick={analyze} disabled={!loaded || !!busy}>
          Tách dáng
        </Button>
        {busy && <Spinner label={busy} />}
      </div>
    </div>
  );
}
