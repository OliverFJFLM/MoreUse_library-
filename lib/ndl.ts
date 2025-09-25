import { parseStringPromise } from 'xml2js';

import type { Work } from './types';

const DEFAULT_BASE = 'https://ndlsearch.ndl.go.jp/api/sru';

const getEnv = (key: string, fallback: string) => process.env[key] ?? fallback;

const pickFirst = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
};

const extractRawIdentifier = (identifier: unknown): string | undefined => {
  if (typeof identifier === 'string') {
    return identifier;
  }
  if (identifier && typeof identifier === 'object') {
    if ('_' in (identifier as Record<string, unknown>) && typeof (identifier as any)._ === 'string') {
      return (identifier as any)._;
    }
    for (const value of Object.values(identifier as Record<string, unknown>)) {
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value)) {
        const first = value.find((item) => typeof item === 'string');
        if (first) {
          return first;
        }
      }
    }
  }
  return undefined;
};

const extractISBN = (identifiers: unknown): string | undefined => {
  if (!Array.isArray(identifiers)) {
    return undefined;
  }

  for (const identifier of identifiers) {
    const raw = extractRawIdentifier(identifier);
    if (!raw) {
      continue;
    }
    const normalised = raw.replace(/[-\s]/g, '');
    if (/^(?:\d{9}[\dXx]|\d{13})$/.test(normalised)) {
      return normalised;
    }
  }

  return undefined;
};

const parseYear = (issued?: string): number | undefined => {
  if (!issued) {
    return undefined;
  }
  const match = issued.match(/(\d{4})/);
  return match ? Number.parseInt(match[1], 10) : undefined;
};

const normaliseArray = (value: unknown): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim());
  }
  if (typeof value === 'string') {
    return [value.trim()];
  }
  return [];
};

const buildSourceUrl = (recordIdentifier?: string): string | undefined => {
  if (!recordIdentifier) {
    return undefined;
  }
  return `https://ndlsearch.ndl.go.jp/books/${recordIdentifier}`;
};

const parseRecord = (record: any): Work | undefined => {
  const metadata = record?.['srw:recordData']?.[0]?.['dcndl:dcndl']?.[0];
  if (!metadata) {
    return undefined;
  }

  const title = pickFirst(metadata['dc:title']);
  if (!title) {
    return undefined;
  }

  const authors = normaliseArray(metadata['dc:creator']);
  const publisher = pickFirst(metadata['dc:publisher']);
  const issued = pickFirst(metadata['dcterms:issued']);
  const description = pickFirst(metadata['dc:description']);
  const identifiers = metadata['dcterms:identifier'];
  const isbn = extractISBN(identifiers);
  const recordIdentifier = pickFirst(metadata['dcndl:BibID']);

  return {
    id: recordIdentifier ?? isbn,
    title: title.trim(),
    authors,
    publisher: publisher?.trim(),
    publishYear: parseYear(issued),
    summary: description?.trim(),
    isbn,
    sources: [
      {
        name: 'NDL Search',
        url: buildSourceUrl(recordIdentifier),
      },
    ].filter((source) => Boolean(source.url)),
  } satisfies Work;
};

export const searchNDL = async (goal: string, limit = 12): Promise<Work[]> => {
  const base = getEnv('NDL_SRU_BASE', DEFAULT_BASE);
  const url = new URL(base);
  url.searchParams.set('operation', 'searchRetrieve');
  url.searchParams.set('version', '1.2');
  url.searchParams.set('recordSchema', 'dcndl');
  url.searchParams.set('maximumRecords', String(limit));
  url.searchParams.set('query', goal);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/xml',
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`NDL Search failed: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = await parseStringPromise(xml);
  const records =
    parsed?.['srw:searchRetrieveResponse']?.['srw:records']?.[0]?.['srw:record'] ?? [];

  return (
    records
      .map((record: any) => parseRecord(record))
      .filter((work): work is Work => Boolean(work))
      .slice(0, limit)
  );
};
