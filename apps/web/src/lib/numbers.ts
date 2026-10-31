// Parse engagement counts the way social apps print them:
// "1.2万", "3.4w", "10万+", "1,2K", "1.5M", "2亿", "1,234", "1.234".
const SUFFIX: Record<string, number> = {
  k: 1e3,
  千: 1e3,
  w: 1e4,
  万: 1e4,
  萬: 1e4,
  m: 1e6,
  亿: 1e8,
  億: 1e8,
  b: 1e9,
};

export function parseCount(input: string | number | null | undefined): number | undefined {
  if (input == null) return undefined;
  if (typeof input === 'number') return Number.isFinite(input) && input >= 0 ? Math.round(input) : undefined;

  let s = input.trim().toLowerCase().replace(/\s+/g, '').replace(/\+$/, '');
  if (!s) return undefined;

  let mult = 1;
  const last = s.slice(-1);
  if (last in SUFFIX) {
    mult = SUFFIX[last];
    s = s.slice(0, -1);
  }
  if (!/^[\d.,]+$/.test(s)) return undefined;

  if (mult > 1) {
    // With a suffix the separator is a decimal point ("1,2K" = 1.2K).
    s = s.replace(',', '.');
    if ((s.match(/\./g) ?? []).length > 1) return undefined;
  } else if (/^\d{1,3}([.,]\d{3})+$/.test(s)) {
    // "1,234" or "1.234" (Vietnamese style) are thousand separators.
    s = s.replace(/[.,]/g, '');
  } else {
    s = s.replace(',', '.');
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * mult);
}

export function formatCount(n: number | undefined): string {
  if (n == null) return '–';
  if (n >= 1e6) return `${trim(n / 1e6)}M`;
  if (n >= 1e3) return `${trim(n / 1e3)}K`;
  return String(n);
}

function trim(x: number): string {
  return x >= 100 ? String(Math.round(x)) : x.toFixed(1).replace(/\.0$/, '');
}
