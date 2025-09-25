import type { Holding, HoldingsResponse, HoldingStatus } from './types';

const DEFAULT_ENDPOINT = 'https://api.calil.jp/check';

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value) {
    return value;
  }
  if (fallback) {
    return fallback;
  }
  throw new Error(`Missing environment variable: ${key}`);
};

const statusPriority: HoldingStatus[] = ['貸出可', '館内', '貸出中', '不明', '更新中'];

const normaliseLibkeyStatus = (value: string): HoldingStatus => {
  if (/貸出可|利用可|在庫|available|蔵書あり|○/iu.test(value)) {
    return '貸出可';
  }
  if (/館内|禁帯出|閲覧|参照/iu.test(value)) {
    return '館内';
  }
  if (/貸出中|×|不可|満員|予約/iu.test(value)) {
    return '貸出中';
  }
  return '不明';
};

const aggregateStatus = (entry: any): HoldingStatus => {
  if (!entry || entry.status !== 'OK') {
    return '更新中';
  }
  const libkey = entry.libkey;
  if (!libkey) {
    return '不明';
  }
  const values = Object.values(libkey).filter((value): value is string => typeof value === 'string');
  if (!values.length) {
    return '不明';
  }

  for (const desired of statusPriority) {
    if (values.some((value) => normaliseLibkeyStatus(value) === desired)) {
      return desired;
    }
  }

  return '不明';
};

export const checkHoldings = async (isbns: string[], sysids: string[]): Promise<HoldingsResponse> => {
  const filteredIsbns = Array.from(new Set(isbns.filter(Boolean)));
  if (!filteredIsbns.length) {
    return { holdings: [], polled: false };
  }

  const endpoint = getEnv('CALIL_CHECK_ENDPOINT', DEFAULT_ENDPOINT);
  const appKey = getEnv('CALIL_APP_KEY');

  const url = new URL(endpoint);
  url.searchParams.set('appkey', appKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('isbn', filteredIsbns.join(','));
  url.searchParams.set('systemid', sysids.join(','));
  url.searchParams.set('callback', '');

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Calil check failed: ${response.status}`);
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  const polled = payload?.continue === 1;
  const books = payload?.books ?? {};

  const holdings: Holding[] = [];

  filteredIsbns.forEach((isbn) => {
    const bookEntry = books[isbn] ?? {};
    sysids.forEach((sysid) => {
      const sysEntry = bookEntry?.[sysid];
      let status: HoldingStatus;
      if (polled) {
        status = '更新中';
      } else {
        status = aggregateStatus(sysEntry);
      }
      holdings.push({
        isbn,
        sysid,
        status,
      });
    });
  });

  return { holdings, polled };
};
