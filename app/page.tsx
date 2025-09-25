'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';

import type { Recommendation } from '@/lib/types';

const sysids =
  process.env.NEXT_PUBLIC_TARGET_SYSIDS?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];

const statusLabels: Record<string, string> = {
  貸出可: '貸出可',
  館内: '館内利用',
  貸出中: '貸出中',
  不明: '不明',
  更新中: '更新中',
};

const statusClassName: Record<string, string> = {
  貸出可: 'status-ready',
  館内: 'status-inhouse',
  貸出中: 'status-loaned',
  不明: 'status-unknown',
  更新中: 'status-pending',
};

type ApiResponse = {
  goal: string;
  area: string | null;
  polled: boolean;
  results: Recommendation[];
  credit: string[];
  message?: string;
};

const buildReserveUrl = (isbn: string, sysid: string) =>
  `https://calil.jp/search?q=${encodeURIComponent(isbn)}&sysid=${encodeURIComponent(sysid)}`;

export default function HomePage() {
  const [goal, setGoal] = useState('');
  const [results, setResults] = useState<Recommendation[]>([]);
  const [credits, setCredits] = useState<string[]>(['書誌: NDL Search', '補強: openBD', '所蔵: カーリル']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [polled, setPolled] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, area: sysids.join(',') || undefined }),
      });

      if (!response.ok) {
        throw new Error('検索に失敗しました。時間をおいて再度お試しください。');
      }

      const data = (await response.json()) as ApiResponse;
      setResults(data.results);
      setPolled(data.polled);
      setCredits(data.credit);
      setNotice(data.message ?? (data.polled ? '所蔵状況を確認中です。数秒後に再検索してください。' : null));
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : '検索に失敗しました');
      setResults([]);
      setPolled(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <header className="hero">
        <h1>目的から図書を探す</h1>
        <p>実現したいことを入力すると、宮崎市周辺で今読める本をおすすめします。</p>
      </header>
      <section className="search">
        <form onSubmit={handleSubmit} className="search-form">
          <label htmlFor="goal">達成したいこと</label>
          <div className="search-control">
            <input
              id="goal"
              name="goal"
              type="text"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="例: 商店街活性化のための地域マーケ基礎"
              maxLength={200}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? '検索中…' : '検索する'}
            </button>
          </div>
        </form>
        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}
      </section>
      <section aria-live="polite" className="results">
        {results.length === 0 && !loading && !error ? (
          <p className="empty">まだ検索結果がありません。</p>
        ) : (
          <ul className="card-list">
            {results.map((item) => (
              <li key={item.work.id ?? item.work.isbn ?? item.work.title} className="card">
                <div className="card-media">
                  {item.work.cover ? (
                    <Image
                      src={item.work.cover}
                      alt={`${item.work.title} の表紙`}
                      width={120}
                      height={176}
                      className="cover-image"
                    />
                  ) : (
                    <div className="placeholder" aria-hidden="true">
                      No Image
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <h2>{item.work.title}</h2>
                  {item.work.authors.length > 0 && <p className="authors">{item.work.authors.join('、')}</p>}
                  {item.work.summary && <p className="summary">{item.work.summary}</p>}
                  <div className="meta">
                    {item.work.publishYear && <span>出版年: {item.work.publishYear}</span>}
                    {item.work.isbn && <span>ISBN: {item.work.isbn}</span>}
                    {item.work.ndc && <span>NDC: {item.work.ndc}</span>}
                  </div>
                  <div className="holdings">
                    {item.holdings.map((holding) => (
                      <div key={`${holding.sysid}-${holding.isbn}`} className={`holding ${statusClassName[holding.status]}`}>
                        <span className="label">{holding.sysid}</span>
                        <span className="status">{statusLabels[holding.status] ?? holding.status}</span>
                        {item.work.isbn && (
                          <a
                            href={buildReserveUrl(item.work.isbn, holding.sysid)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            予約/所蔵を確認
                          </a>
                        )}
                      </div>
                    ))}
                    {item.holdings.length === 0 && (
                      <p className="holding none">所蔵情報が見つかりませんでした。</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <footer className="footer">
        <ul>
          {(polled ? ['所蔵状況更新中'] : []).map((item) => (
            <li key={item}>{item}</li>
          ))}
          {credits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
