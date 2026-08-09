# kaji-match 開発ガイド

## プロジェクト構成

```text
kaji-match/
├── src/
│   ├── client/          ← React フロントエンド (Vite)
│   │   ├── pages/      ← ページコンポーネント
│   │   └── lib/        ← API クライアント, ストア
│   └── worker/          ← Cloudflare Workers バックエンド (Hono)
│       ├── routes/      ← APIルート
│       └── db/          ← Drizzle ORM スキーマ
├── drizzle/migrations/  ← D1 マイグレーションファイル
├── wrangler.toml        ← Cloudflare 設定
└── drizzle.config.ts    ← Drizzle Kit 設定
```

**技術スタック:**
- フロントエンド: React + Vite + TailwindCSS
- バックエンド: Hono (Cloudflare Workers上で動作)
- DB: Cloudflare D1 (SQLite互換)
- ORM: Drizzle ORM

---

## 1. 初回セットアップ（新しいPCなどで）

```bash
# リポジトリをクローン
git clone <your-repo-url>
cd kaji-match

# 依存関係インストール
npm install

# Cloudflare にログイン（初回のみ）
npx wrangler login
```

`wrangler login` でブラウザが開き、Cloudflareアカウントと連携される。

---

## 2. ローカル開発

### フロントエンドだけ動かす

```bash
npm run dev
```

Vite の開発サーバーが起動する（通常 http://localhost:5173）。

### バックエンド（Worker）をローカルで動かす

```bash
npm run dev:worker
```

Wrangler がローカルでWorkerをエミュレートする（通常 http://localhost:8787）。D1もローカルのSQLiteファイルで動く。

### ローカルDBにマイグレーション適用

```bash
npm run db:migrate:local
```

---

## 3. DBスキーマを変更したいとき

1. `src/worker/db/schema.ts` を編集
2. マイグレーションファイル生成:

```bash
npm run db:generate
```

3. ローカルに適用:

```bash
npm run db:migrate:local
```

4. 本番に適用:

```bash
npm run db:migrate:remote
```

---

## 4. デプロイ

```bash
npm run deploy
```

`vite build`（フロントエンドのビルド）→ `wrangler deploy`（Workerとして本番にデプロイ）が一発で走る。

---

## 5. 新しいAPIルートを追加したいとき

1. `src/worker/routes/` に新しいファイルを作る（既存の `tasks.ts` などを参考に）
2. `src/worker/index.ts` でそのルートをインポートして登録
3. フロントエンドから呼ぶ場合は `src/client/lib/api.ts` にメソッド追加

---

## 6. よく使うコマンドまとめ

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | フロントエンド開発サーバー |
| `npm run dev:worker` | Worker ローカル実行 |
| `npm run db:generate` | スキーマからマイグレーション生成 |
| `npm run db:migrate:local` | ローカルDBにマイグレーション適用 |
| `npm run db:migrate:remote` | 本番DBにマイグレーション適用 |
| `npm run deploy` | 本番デプロイ |
| `npx wrangler d1 execute kaji-match-db --local --command "SELECT ..."` | ローカルDBに直接クエリ |

---

## 7. 新規プロジェクトをゼロから作りたい場合

```bash
# Workers プロジェクト作成
npm create cloudflare@latest my-app

# D1データベース作成
npx wrangler d1 create my-db

# 出力される database_id を wrangler.toml に設定
```

あとは今回のプロジェクトと同じように Hono, Drizzle, Vite, React を追加していけばOK。
