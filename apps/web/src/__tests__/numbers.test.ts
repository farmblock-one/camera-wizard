import { describe, expect, it } from 'vitest';
import { formatCount, parseCount } from '../lib/numbers';

describe('parseCount', () => {
  it.each([
    ['1.2万', 12000],
    ['3.4w', 34000],
    ['3.4W', 34000],
    ['10万+', 100000],
    ['1,2K', 1200],
    ['1.2k', 1200],
    ['1.5M', 1500000],
    ['2亿', 200000000],
    ['1,234', 1234],
    ['1.234', 1234],
    ['12.345.678', 12345678],
    ['999', 999],
    [' 56 ', 56],
    ['2.5', 3],
  ])('%s → %d', (s, n) => expect(parseCount(s)).toBe(n));

  it.each(['', 'abc', '1.2.3万', '-5'])('rejects %j', (s) => expect(parseCount(s)).toBeUndefined());
});

describe('formatCount', () => {
  it('formats', () => {
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1200)).toBe('1.2K');
    expect(formatCount(12000)).toBe('12K');
    expect(formatCount(1500000)).toBe('1.5M');
    expect(formatCount(undefined)).toBe('–');
  });
});
