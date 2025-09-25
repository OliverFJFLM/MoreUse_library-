import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkHoldings } from '@/lib/calil';

const isbn = '9784123456789';
const sysids = ['Miyazaki_Miyazaki', 'Miyazaki_Pref'];

describe('checkHoldings', () => {
  beforeEach(() => {
    process.env.CALIL_APP_KEY = 'test';
    process.env.CALIL_CHECK_ENDPOINT = 'https://api.example.com/check';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('flags polled results when continue is 1', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ continue: 1, books: {} }),
    })));

    const response = await checkHoldings([isbn], sysids);
    expect(response.polled).toBe(true);
    expect(response.holdings).toHaveLength(2);
    response.holdings.forEach((holding) => expect(holding.status).toBe('更新中'));
  });

  it('aggregates library status with priority', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          continue: 0,
          books: {
            [isbn]: {
              Miyazaki_Miyazaki: {
                status: 'OK',
                libkey: {
                  本館: '貸出中',
                  分館: '貸出可',
                },
              },
              Miyazaki_Pref: {
                status: 'OK',
                libkey: {
                  県立図書館: '館内',
                },
              },
            },
          },
        }),
    })));

    const response = await checkHoldings([isbn], sysids);
    expect(response.polled).toBe(false);
    expect(response.holdings).toEqual([
      { isbn, sysid: 'Miyazaki_Miyazaki', status: '貸出可' },
      { isbn, sysid: 'Miyazaki_Pref', status: '館内' },
    ]);
  });
});
