import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-yellow-400 text-neutral-950 active:bg-yellow-300 disabled:bg-yellow-400/40',
  secondary: 'bg-neutral-800 text-neutral-100 active:bg-neutral-700 disabled:opacity-40',
  ghost: 'bg-transparent text-neutral-300 active:bg-neutral-800 disabled:opacity-40',
  danger: 'bg-red-600/90 text-white active:bg-red-500 disabled:opacity-40',
};

export function Button({ variant = 'secondary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? 'border-yellow-400 bg-yellow-400 text-neutral-950' : 'border-neutral-700 bg-neutral-900 text-neutral-300'
      }`}
    >
      {children}
    </button>
  );
}

export function Header({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-neutral-900 bg-neutral-950/90 backdrop-blur">
      <div className="flex h-12 items-center gap-2 px-3">
        {onBack && (
          <button type="button" onClick={onBack} className="-ml-1 rounded-lg px-2 py-1 text-2xl leading-none text-neutral-300" aria-label="Quay lại">
            ‹
          </button>
        )}
        <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-yellow-400" />
      {label}
    </div>
  );
}

export function ViralBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const color = score >= 75 ? 'bg-red-500' : score >= 50 ? 'bg-orange-500' : 'bg-neutral-700';
  return <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white ${color}`}>🔥 {score}</span>;
}

/** Labelled form field. Use `group` for a set of buttons (a <label> would click the first one). */
export function Field({ label, children, group = false }: { label: string; children: ReactNode; group?: boolean }) {
  const Tag = group ? 'div' : 'label';
  return (
    <Tag className="block" role={group ? 'group' : undefined} aria-label={group ? label : undefined}>
      <span className="mb-1 block text-xs font-medium text-neutral-400">{label}</span>
      {children}
    </Tag>
  );
}

export const inputClass =
  'w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-base text-neutral-100 placeholder:text-neutral-600 focus:border-yellow-400 focus:outline-none';
