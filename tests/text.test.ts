import { describe, expect, it } from 'vitest';

import { concatText, similarity } from '@/lib/text';

describe('text utilities', () => {
  it('computes higher similarity for overlapping words', () => {
    const base = similarity('観光DX', '観光DX入門');
    const low = similarity('観光DX', '金融工学');
    expect(base).toBeGreaterThan(low);
  });

  it('returns zero similarity when no tokens overlap', () => {
    expect(similarity('観光DX', '')).toBe(0);
    expect(similarity('', '観光DX入門')).toBe(0);
  });

  it('concatenates truthy strings with spaces', () => {
    expect(concatText('a', undefined, 'b')).toBe('a b');
  });
});
