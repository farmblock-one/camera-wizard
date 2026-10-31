import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { CropRect } from '../lib/image';

type Mode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

interface Props {
  url: string;
  width: number;
  height: number;
  value: CropRect;
  onChange: (r: CropRect) => void;
}

const MIN = 0.05;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Drag the box to move it, drag a corner to resize. Works with touch and mouse. */
export function CropEditor({ url, width, height, value, onChange }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: Mode; x: number; y: number; start: CropRect } | null>(null);

  const start = (mode: Mode) => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, start: value };
  };

  const move = (e: ReactPointerEvent) => {
    const d = drag.current;
    const el = box.current;
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - d.x) / rect.width;
    const dy = (e.clientY - d.y) / rect.height;
    const s = d.start;
    let { x, y, w, h } = s;
    if (d.mode === 'move') {
      x = clamp(s.x + dx, 0, 1 - s.w);
      y = clamp(s.y + dy, 0, 1 - s.h);
    } else {
      let left = s.x;
      let top = s.y;
      let right = s.x + s.w;
      let bottom = s.y + s.h;
      if (d.mode.includes('w')) left = clamp(s.x + dx, 0, right - MIN);
      if (d.mode.includes('e')) right = clamp(right + dx, left + MIN, 1);
      if (d.mode.includes('n')) top = clamp(s.y + dy, 0, bottom - MIN);
      if (d.mode.includes('s')) bottom = clamp(bottom + dy, top + MIN, 1);
      x = left;
      y = top;
      w = right - left;
      h = bottom - top;
    }
    onChange({ x, y, w, h });
  };

  const end = () => {
    drag.current = null;
  };

  const pct = (v: number) => `${v * 100}%`;
  const corner = (mode: Mode, pos: string) => (
    <div onPointerDown={start(mode)} className={`absolute h-9 w-9 ${pos} touch-none`}>
      <div className="absolute inset-2.5 rounded-sm border-2 border-yellow-400 bg-neutral-950/40" />
    </div>
  );

  return (
    <div
      ref={box}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-neutral-900"
      style={{ aspectRatio: `${width} / ${height}`, width: `min(100%, calc(58vh * ${width / height}))` }}
    >
      <img src={url} alt="" draggable={false} className="absolute inset-0 h-full w-full object-fill" />
      <div
        onPointerDown={start('move')}
        className="absolute cursor-move border-2 border-yellow-400"
        style={{
          left: pct(value.x),
          top: pct(value.y),
          width: pct(value.w),
          height: pct(value.h),
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="border border-white/15" />
          ))}
        </div>
        {corner('nw', '-left-4 -top-4')}
        {corner('ne', '-right-4 -top-4')}
        {corner('sw', '-bottom-4 -left-4')}
        {corner('se', '-bottom-4 -right-4')}
      </div>
    </div>
  );
}
