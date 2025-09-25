import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/holdings/route';

vi.mock('@/lib/calil', () => ({
  checkHoldings: vi.fn(async () => ({
    polled: false,
    holdings: [
      { isbn: '9784123456789', sysid: 'Miyazaki_Miyazaki', status: '貸出可' },
      { isbn: '9784123456789', sysid: 'Miyazaki_Pref', status: '不明' },
    ],
  })),
}));

describe('GET /api/holdings', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns holdings for requested isbn and sysids', async () => {
    const request = new Request('http://localhost/api/holdings?isbn=9784123456789&sysids=Miyazaki_Miyazaki,Miyazaki_Pref');
    const response = await GET(request as any);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.holdings).toHaveLength(2);
  });
});
