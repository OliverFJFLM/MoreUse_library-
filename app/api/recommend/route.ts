import { NextRequest, NextResponse } from 'next/server';

import { checkHoldings } from '@/lib/calil';
import { enrichWithOpenBD } from '@/lib/openbd';
import { sortReco } from '@/lib/scoring';
import { searchNDL } from '@/lib/ndl';
import type { Recommendation, Work } from '@/lib/types';

const DEFAULT_SYSIDS = ['Miyazaki_Miyazaki', 'Miyazaki_Pref'];
const CREDIT = ['書誌: NDL Search', '補強: openBD', '所蔵: カーリル'];

const getSysids = (area?: string): string[] => {
  if (area) {
    return area.split(',').map((value) => value.trim()).filter(Boolean);
  }
  const envValue = process.env.TARGET_SYSIDS;
  if (envValue) {
    return envValue.split(',').map((value) => value.trim()).filter(Boolean);
  }
  return DEFAULT_SYSIDS;
};

const validateGoal = (goal: unknown): string => {
  if (typeof goal !== 'string') {
    throw new Error('goal must be a string');
  }
  const trimmed = goal.trim();
  if (!trimmed) {
    throw new Error('goal must not be empty');
  }
  if (trimmed.length > 200) {
    throw new Error('goal must be 200 characters or fewer');
  }
  return trimmed;
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 1): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    return withRetry(fn, retries - 1);
  }
};

const groupHoldings = (works: Work[], holdings: Recommendation['holdings']): Map<string, Recommendation['holdings']> => {
  const map = new Map<string, Recommendation['holdings']>();
  works.forEach((work) => {
    if (!work.isbn) {
      return;
    }
    const grouped = holdings.filter((holding) => holding.isbn === work.isbn);
    map.set(work.isbn, grouped);
  });
  return map;
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const goal = validateGoal(body.goal);
    const area = typeof body.area === 'string' ? body.area : undefined;
    const sysids = getSysids(area);

    let works: Work[] = [];
    try {
      works = await withRetry(() => searchNDL(goal), 1);
    } catch (error) {
      console.error('NDL search failed', error);
      return NextResponse.json(
        {
          goal,
          area: area ?? null,
          polled: false,
          results: [],
          credit: CREDIT,
          message: '再試行してください',
        },
        { status: 200 },
      );
    }

    let enriched = works;
    try {
      enriched = await enrichWithOpenBD(works);
    } catch (error) {
      console.error('openBD enrichment failed', error);
    }

    const isbns = enriched.map((work) => work.isbn).filter((isbn): isbn is string => Boolean(isbn));

    let holdingsResponse = { holdings: [], polled: false };
    if (isbns.length) {
      try {
        holdingsResponse = await checkHoldings(isbns, sysids);
      } catch (error) {
        console.error('Calil check failed', error);
      }
    }

    const holdingsMap = groupHoldings(enriched, holdingsResponse.holdings);
    const recommendations = sortReco(
      goal,
      enriched.map((work) => ({
        work,
        score: 0,
        holdings: work.isbn ? holdingsMap.get(work.isbn) ?? [] : [],
      })),
    );

    return NextResponse.json(
      {
        goal,
        area: area ?? null,
        polled: holdingsResponse.polled,
        results: recommendations,
        credit: CREDIT,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('recommend endpoint error', error);
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
};
