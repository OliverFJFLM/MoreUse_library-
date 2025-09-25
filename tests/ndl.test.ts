import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchNDL } from '@/lib/ndl';

describe('searchNDL', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () =>
        `<?xml version="1.0" encoding="UTF-8"?>
        <srw:searchRetrieveResponse xmlns:srw="http://www.loc.gov/zing/srw/" xmlns:dcndl="http://ndl.go.jp/dcndl/terms/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
          <srw:records>
            <srw:record>
              <srw:recordData>
                <dcndl:dcndl>
                  <dc:title>観光DX入門</dc:title>
                  <dc:creator>宮崎 太郎</dc:creator>
                  <dc:publisher>観光出版社</dc:publisher>
                  <dcterms:issued>2020</dcterms:issued>
                  <dc:description>宮崎の観光DX事例を解説。</dc:description>
                  <dcterms:identifier xsi:type="dcndl:ISBN" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">978-4-1234-5678-9</dcterms:identifier>
                  <dcndl:BibID>123456789</dcndl:BibID>
                </dcndl:dcndl>
              </srw:recordData>
            </srw:record>
          </srw:records>
        </srw:searchRetrieveResponse>`,
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses records from NDL SRU', async () => {
    const works = await searchNDL('観光DX');
    expect(works).toHaveLength(1);
    expect(works[0]).toMatchObject({
      title: '観光DX入門',
      authors: ['宮崎 太郎'],
      isbn: '9784123456789',
      publishYear: 2020,
    });
  });
});
