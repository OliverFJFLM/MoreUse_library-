import { describe, expect, it } from 'vitest';

import { availabilityBonus, scoreWork, sortReco } from '@/lib/scoring';
import type { Recommendation, Work } from '@/lib/types';

describe('scoring', () => {
  const goal = '観光DX';
  const baseWork: Work = {
    title: '観光DX入門',
    authors: ['宮崎 太郎'],
    publishYear: 2015,
  };

  it('gives higher score when summary exists', () => {
    const withoutSummary = scoreWork(goal, baseWork);
    const withSummary = scoreWork(goal, { ...baseWork, summary: '観光DXの基礎を学べる入門書。' });
    expect(withSummary).toBeGreaterThan(withoutSummary);
  });

  it('adds availability bonus based on holdings', () => {
    const bonus = availabilityBonus([
      { isbn: '9784123456789', sysid: 'Miyazaki_Miyazaki', status: '貸出中' },
      { isbn: '9784123456789', sysid: 'Miyazaki_Pref', status: '貸出可' },
    ]);
    expect(bonus).toBe(0.15);
  });

  it('sorts recommendations by combined score', () => {
    const items: Recommendation[] = [
      {
        work: baseWork,
        score: 0,
        holdings: [{ isbn: '1', sysid: 'Miyazaki_Miyazaki', status: '貸出可' }],
      },
      {
        work: { ...baseWork, title: '別の本', summary: '概要付き' },
        score: 0,
        holdings: [{ isbn: '2', sysid: 'Miyazaki_Miyazaki', status: '貸出中' }],
      },
    ];

    const sorted = sortReco(goal, items);
    expect(sorted[0].holdings[0].isbn).toBe('1');
  });
});
