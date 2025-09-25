import { NextRequest, NextResponse } from 'next/server';

import { checkHoldings } from '@/lib/calil';
import type { HoldingStatus } from '@/lib/types';

const parseList = (value: string | null) =>
  value?.split(',').map((part) => part.trim()).filter(Boolean) ?? [];

const fallbackHoldings = (isbns: string[], sysids: string[], status: HoldingStatus) =>
  isbns.flatMap((isbn) => sysids.map((sysid) => ({ isbn, sysid, status })));

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const isbns = parseList(searchParams.get('isbn'));
    const sysids = parseList(searchParams.get('sysids'));

    if (!isbns.length || !sysids.length) {
      return NextResponse.json({ error: 'isbn and sysids are required' }, { status: 400 });
    }

    try {
      const response = await checkHoldings(isbns, sysids);
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error('Calil check failed', error);
      return NextResponse.json(
        {
          holdings: fallbackHoldings(isbns, sysids, '不明'),
          polled: false,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('holdings endpoint error', error);
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
};
