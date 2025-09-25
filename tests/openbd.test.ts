import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enrichWithOpenBD } from '@/lib/openbd';

const isbn = '9784123456789';

describe('enrichWithOpenBD', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [
        {
          summary: {
            cover: 'https://example.com/cover.jpg',
            ndc: '007.3',
          },
          onix: {
            CollateralDetail: {
              TextContent: [
                {
                  Text: 'デジタル観光の実践ガイド。',
                },
              ],
            },
          },
        },
      ],
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('merges openBD data into works', async () => {
    const works = await enrichWithOpenBD([
      {
        title: '観光DX入門',
        authors: ['宮崎 太郎'],
        isbn,
      },
    ]);

    expect(works[0]).toMatchObject({
      summary: 'デジタル観光の実践ガイド。',
      cover: 'https://example.com/cover.jpg',
      ndc: '007.3',
    });
  });
});
