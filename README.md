# カジマッチ - 家族のお手伝い管理アプリ

家庭版タイミー。親がお手伝いタスクを作成し、子供が完了報告してポイントを貯めるアプリ。

## 技術スタック

- **バックエンド**: Hono (Cloudflare Workers)
- **データベース**: Cloudflare D1 + Drizzle ORM
- **フロントエンド**: React + Tailwind CSS (Vite)
- **デプロイ**: Cloudflare Workers/Pages 無料枠

## ローカル開発

### 初回セットアップ

```bash
npm install
npm run db:migrate:local
```

### 開発サーバー起動

ターミナルを2つ開いて実行:

```bash
# ターミナル1: Workerサーバー (API + DB)
npm run dev:worker

# ターミナル2: Vite開発サーバー (フロントエンド)
npm run dev
```

- フロントエンド: http://localhost:5173
- API: http://localhost:8787/api

Vite開発サーバーは `/api` へのリクエストを自動的に8787にプロキシします。

## デプロイ

### 1. D1データベースを作成

```bash
npx wrangler d1 create kaji-match-db
```

`wrangler.toml` の `database_id` を出力されたIDに書き換えてください。

### 2. リモートDBにマイグレーション適用

```bash
npm run db:migrate:remote
```

### 3. デプロイ

```bash
npm run deploy
```

## 使い方

1. **親**: 「家族グループを作成する」からグループを作成
2. **子供**: 表示される招待コードを入力して参加
3. **親**: タスクを作成（タイトル・詳細・報酬ポイント）
4. **子供**: 「やった！」ボタンで完了申請
5. **親**: 「承認待ち」タブで申請を承認 → ポイント付与
