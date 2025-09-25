import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '宮崎市 図書館レコメンド',
  description: '目的にあわせて宮崎市内の公共図書館で利用できる書籍をおすすめします。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
