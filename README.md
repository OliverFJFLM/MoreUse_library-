# 宮崎市 図書館レコメンド MVP

宮崎市および宮崎県の公共図書館で今すぐ読める可能性が高い書籍を、利用者の目的テキストに基づいてレコメンドする Next.js アプリケーションです。

## セットアップ

1. 依存関係をインストールします。

   ```bash
   npm install
   ```

2. `.env` を作成し、必要な環境変数を設定します。

   ```bash
   cp .env.example .env
   # CALIL_APP_KEY にカーリルから発行されたキーを設定
   ```

3. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

4. ブラウザで `http://localhost:3000` を開きます。

## テスト

単体・結合テストは Vitest で実行できます。

```bash
npm run test:unit
```

## 主な機能

- NDL Search SRU API を利用した書誌検索
- openBD API によるカバー画像・要約・NDC の補完
- カーリル蔵書検索 API を用いた所蔵ステータスの取得
- 目的テキストと書誌情報を用いた簡易スコアリング
- スマートフォン向けに最適化したカード型 UI

## ディレクトリ構成

```
app/
  api/
    holdings/route.ts   # GET /api/holdings
    recommend/route.ts  # POST /api/recommend
  globals.css
  layout.tsx
  page.tsx
lib/
  calil.ts   # カーリル API クライアント
  ndl.ts     # NDL Search クライアント
  openbd.ts  # openBD クライアント
  scoring.ts # スコアリングロジック
  text.ts    # テキストユーティリティ
  types.ts   # 共通型定義
```

## 環境変数

- `CALIL_APP_KEY` (必須): カーリル API キー
- `TARGET_SYSIDS`: 対象とする図書館システム ID (デフォルト: `Miyazaki_Miyazaki,Miyazaki_Pref`)
- `NDL_SRU_BASE`: NDL SRU API のベース URL
- `OPENBD_BASE`: openBD API のベース URL
- `NEXT_PUBLIC_TARGET_SYSIDS`: クライアント表示用の図書館システム ID

## ライセンス

このプロジェクトは学習目的のサンプル実装です。
