import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/recommend/route';
import type { Recommendation, Work } from '@/lib/types';

vi.mock('@/lib/ndl', () => ({
  searchNDL: vi.fn(async () => [
    {
      title: '観光DX入門',
      authors: ['宮崎 太郎'],
      summary: '概要',
      isbn: '9784123456789',
    },
  ] satisfies Work[]),
}));

vi.mock('@/lib/openbd', () => ({
  enrichWithOpenBD: vi.fn(async (works: Work[]) => works),
}));

vi.mock('@/lib/calil', () => ({
  checkHoldings: vi.fn(async () => ({
    polled: false,
    holdings: [
      { isbn: '9784123456789', sysid: 'Miyazaki_Miyazaki', status: '貸出可' },
      { isbn: '9784123456789', sysid: 'Miyazaki_Pref', status: '貸出中' },
    ],
  })),
}));

describe('POST /api/recommend', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns recommendations within the limit', async () => {
    const request = new Request('http://localhost/api/recommend', {
      method: 'POST',
      body: JSON.stringify({ goal: '観光DX' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { results: Recommendation[] };
    expect(payload.results).toHaveLength(1);
    expect(payload.results[0].holdings).toHaveLength(2);
  });
});
