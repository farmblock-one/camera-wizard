import { useState } from 'react';
import { CITIES, DESTINATIONS, PRESET_TAGS } from '../data/destinations';
import { PLATFORMS, type Engagement, type Platform } from '../db/db';
import { formatCount, parseCount } from '../lib/numbers';
import { Chip, Field, inputClass } from './ui';

export interface Meta {
  platform: Platform;
  likes: string;
  saves: string;
  comments: string;
  shares: string;
  postedAt: string;
  destinationId: string;
  tags: string[];
  note: string;
}

export const EMPTY_META: Meta = {
  platform: 'xiaohongshu',
  likes: '',
  saves: '',
  comments: '',
  shares: '',
  postedAt: '',
  destinationId: '',
  tags: [],
  note: '',
};

export function metaToEngagement(m: Meta): Engagement | undefined {
  const e: Engagement = {
    likes: parseCount(m.likes),
    saves: parseCount(m.saves),
    comments: parseCount(m.comments),
    shares: parseCount(m.shares),
  };
  return Object.values(e).some((v) => v != null) ? e : undefined;
}

export function engagementToMeta(e?: Engagement): Pick<Meta, 'likes' | 'saves' | 'comments' | 'shares'> {
  const s = (n?: number) => (n == null ? '' : String(n));
  return { likes: s(e?.likes), saves: s(e?.saves), comments: s(e?.comments), shares: s(e?.shares) };
}

const COUNT_FIELDS: { key: 'likes' | 'saves' | 'comments' | 'shares'; label: string; zh: string }[] = [
  { key: 'likes', label: 'Like', zh: '赞' },
  { key: 'saves', label: 'Lưu', zh: '收藏' },
  { key: 'comments', label: 'Bình luận', zh: '评论' },
  { key: 'shares', label: 'Chia sẻ', zh: '分享' },
];

export function DestinationSelect({ value, onChange, allLabel = '— Chưa chọn —' }: { value: string; onChange: (v: string) => void; allLabel?: string }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel}</option>
      {CITIES.map((c) => (
        <optgroup key={c.id} label={c.name}>
          {DESTINATIONS.filter((d) => d.city === c.id).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} {d.city !== 'generic' ? `· ${d.zh}` : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function MetaForm({ value, onChange }: { value: Meta; onChange: (m: Meta) => void }) {
  const [custom, setCustom] = useState('');
  const set = <K extends keyof Meta>(k: K, v: Meta[K]) => onChange({ ...value, [k]: v });
  const toggleTag = (t: string) => set('tags', value.tags.includes(t) ? value.tags.filter((x) => x !== t) : [...value.tags, t]);
  const allTags = [...PRESET_TAGS, ...value.tags.filter((t) => !PRESET_TAGS.includes(t))];

  return (
    <div className="space-y-4">
      <Field label="Nền tảng" group>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Chip key={p.id} active={value.platform === p.id} onClick={() => set('platform', p.id)}>
              {p.label}
            </Chip>
          ))}
        </div>
      </Field>

      <div>
        <span className="mb-1 block text-xs font-medium text-neutral-400">Số liệu bài đăng (gõ như trên app: 1.2万, 3.4w, 12K…)</span>
        <div className="grid grid-cols-2 gap-2">
          {COUNT_FIELDS.map((f) => {
            const parsed = parseCount(value[f.key]);
            return (
              <label key={f.key} className="block">
                <div className="relative">
                  <input
                    className={`${inputClass} pr-16`}
                    inputMode="decimal"
                    placeholder={f.label}
                    value={value[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                    {value[f.key] ? (parsed == null ? '⚠️' : formatCount(parsed)) : f.zh}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Ngày đăng (nếu biết)">
          <input type="date" className={inputClass} value={value.postedAt} onChange={(e) => set('postedAt', e.target.value)} />
        </Field>
        <Field label="Địa điểm">
          <DestinationSelect value={value.destinationId} onChange={(v) => set('destinationId', v)} />
        </Field>
      </div>

      <Field label="Tag" group>
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <Chip key={t} active={value.tags.includes(t)} onClick={() => toggleTag(t)}>
              {t}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input className={inputClass} placeholder="Tag khác…" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button
            type="button"
            className="rounded-xl bg-neutral-800 px-4 text-sm font-semibold"
            onClick={() => {
              const t = custom.trim();
              if (t && !value.tags.includes(t)) set('tags', [...value.tags, t]);
              setCustom('');
            }}
          >
            Thêm
          </button>
        </div>
      </Field>

      <Field label="Ghi chú / mẹo chụp">
        <textarea
          className={`${inputClass} min-h-20`}
          placeholder="vd: chụp từ dưới lên, ống 0.5x, đứng lệch trái"
          value={value.note}
          onChange={(e) => set('note', e.target.value)}
        />
      </Field>
    </div>
  );
}
