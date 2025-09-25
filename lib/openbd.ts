import type { Work } from './types';

const DEFAULT_BASE = 'https://api.openbd.jp/v1';

const getEnv = (key: string, fallback: string) => process.env[key] ?? fallback;

const extractSummary = (entry: any): string | undefined => {
  const textContents = entry?.onix?.CollateralDetail?.TextContent;
  if (Array.isArray(textContents)) {
    for (const content of textContents) {
      if (content?.Text) {
        return String(content.Text);
      }
    }
  }
  const summary = entry?.summary?.description;
  if (typeof summary === 'string') {
    return summary;
  }
  return undefined;
};

const extractNdc = (entry: any): string | undefined => {
  const ndc = entry?.summary?.ndc || entry?.summary?.subject;
  if (typeof ndc === 'string') {
    return ndc;
  }
  return undefined;
};

const extractCover = (entry: any): string | undefined => {
  const cover = entry?.summary?.cover || entry?.summary?.cover_url;
  if (typeof cover === 'string') {
    return cover;
  }
  return undefined;
};

export const enrichWithOpenBD = async (works: Work[]): Promise<Work[]> => {
  const isbnList = Array.from(new Set(works.map((work) => work.isbn).filter((isbn): isbn is string => Boolean(isbn))));

  if (isbnList.length === 0) {
    return works;
  }

  const base = getEnv('OPENBD_BASE', DEFAULT_BASE);
  const url = new URL('get', base.endsWith('/') ? base : `${base}/`);
  url.searchParams.set('isbn', isbnList.join(','));

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`openBD failed: ${response.status}`);
  }

  const payload = (await response.json()) as Array<any | null>;

  const byIsbn = new Map<string, any>();
  payload.forEach((entry, index) => {
    const isbn = isbnList[index];
    if (entry && isbn) {
      byIsbn.set(isbn, entry);
    }
  });

  return works.map((work) => {
    if (!work.isbn) {
      return work;
    }

    const entry = byIsbn.get(work.isbn);
    if (!entry) {
      return work;
    }

    const summary = extractSummary(entry) ?? work.summary;
    const cover = extractCover(entry) ?? work.cover;
    const ndc = extractNdc(entry) ?? work.ndc;

    return {
      ...work,
      summary,
      cover,
      ndc,
    } satisfies Work;
  });
};
