# ゼロからCloudflareフルスタックアプリを作る方法

## 全体像を先に理解する

普通のWebアプリは3つのパーツでできている:

1. **フロントエンド** — ブラウザで動くUI（HTML/CSS/JavaScript）
2. **バックエンド（API）** — サーバーで動くロジック（データの保存・取得・認証など）
3. **データベース** — データを永続的に保存する場所

Cloudflareを使う場合、これが以下に対応する:

| パーツ | Cloudflareでの実現方法 |
| --- | --- |
| フロントエンド | Cloudflare Workers（静的ファイル配信） |
| バックエンド | Cloudflare Workers（Hono等のフレームワーク） |
| データベース | Cloudflare D1（SQLiteベース） |

Workers が「サーバー」の役割を果たし、フロントもバックも1つのWorkerから配信する構成。

---

## 前提条件

- Node.js がインストール済み（https://nodejs.org/）
- Cloudflare のアカウントを作成済み（https://dash.cloudflare.com/sign-up）
- ターミナルの基本操作ができる（cd, lsなど）

---

## ステップ1: プロジェクトの雛形を作る

```bash
mkdir my-app
cd my-app
npm init -y
```

`package.json` ができる。これがプロジェクトの設定ファイル。

---

## ステップ2: 必要なパッケージをインストールする

```bash
# バックエンド
npm install hono drizzle-orm

# フロントエンド
npm install react react-dom react-router-dom

# 開発用ツール
npm install -D wrangler typescript vite @vitejs/plugin-react
npm install -D @cloudflare/workers-types @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer
npm install -D drizzle-kit
```

それぞれ何をするものか:

| パッケージ | 役割 |
| --- | --- |
| hono | 軽量Webフレームワーク。ExpressのCloudflare版みたいなもの |
| drizzle-orm | DBを操作するためのORM。SQLを直書きしなくて済む |
| react | UIを部品（コンポーネント）単位で作るためのライブラリ |
| react-router-dom | ページ遷移を管理する |
| wrangler | Cloudflare Workers のCLIツール。ローカル実行・デプロイに使う |
| vite | フロントエンドのビルドツール。開発サーバーも兼ねる |
| tailwindcss | CSSをクラス名で書けるユーティリティ |
| drizzle-kit | DBマイグレーション（テーブル作成・変更）を管理する |

---

## ステップ3: Cloudflareにログインする

```bash
npx wrangler login
```

ブラウザが開くのでログインする。これで自分のPCからCloudflareを操作できるようになる。

---

## ステップ4: D1データベースを作成する

```bash
npx wrangler d1 create my-app-db
```

実行すると以下のような出力が返る:

```
[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

この情報を次のステップで使う。

---

## ステップ5: wrangler.toml を作る

プロジェクトルートに `wrangler.toml` を作る。これがCloudflare Workersの設定ファイル。

```toml
name = "my-app"
compatibility_date = "2024-05-29"
main = "src/worker/index.ts"

[site]
bucket = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "ステップ4で取得したID"
migrations_dir = "drizzle/migrations"
```

各項目の意味:
- `name` — アプリ名（デプロイ時のURLに使われる）
- `main` — バックエンドのエントリーポイント
- `[site] bucket` — フロントエンドのビルド済みファイルの場所
- `[[d1_databases]]` — 使うDBの設定。`binding = "DB"` でコード内から `env.DB` でアクセスできる

---

## ステップ6: ディレクトリ構造を作る

```bash
mkdir -p src/worker/routes
mkdir -p src/worker/db
mkdir -p src/client/pages
mkdir -p src/client/lib
```

最終的にこうなる:

```text
my-app/
├── src/
│   ├── worker/         ← バックエンド（API）
│   │   ├── index.ts   ← エントリーポイント
│   │   ├── routes/    ← 各APIのルート定義
│   │   └── db/
│   │       └── schema.ts  ← テーブル定義
│   └── client/         ← フロントエンド（React）
│       ├── main.tsx    ← Reactのエントリーポイント
│       ├── App.tsx     ← ルーティング定義
│       ├── pages/      ← 各ページ
│       └── lib/        ← 共通ユーティリティ
├── drizzle/migrations/ ← DBマイグレーションファイル（自動生成）
├── wrangler.toml
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

---

## ステップ7: 設定ファイルを作る

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
```

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});
```

### tailwind.config.js

```javascript
export default {
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/worker/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
});
```

### index.html（プロジェクトルートに置く）

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/client/main.tsx"></script>
</body>
</html>
```

---

## ステップ8: バックエンドを作る

### src/worker/db/schema.ts — テーブル定義

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 例: ユーザーテーブル
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
```

ここにテーブル（＝データの構造）を定義していく。

### src/worker/index.ts — APIのエントリーポイント

```typescript
import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// APIルート
app.get("/api/hello", (c) => {
  return c.json({ message: "Hello World" });
});

// フロントエンド配信（APIに一致しないリクエストは静的ファイルを返す）
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
```

### src/worker/routes/users.ts — ルート分割の例

```typescript
import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { users } from "../db/schema";

type Bindings = { DB: D1Database };

const usersRoute = new Hono<{ Bindings: Bindings }>();

// ユーザー一覧取得
usersRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});

// ユーザー作成
usersRoute.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  await db.insert(users).values({ name: body.name, email: body.email });
  return c.json({ success: true }, 201);
});

export { usersRoute };
```

index.ts に追加:

```typescript
import { usersRoute } from "./routes/users";
app.route("/api/users", usersRoute);
```

---

## ステップ9: フロントエンドを作る

### src/client/main.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

### src/client/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### src/client/App.tsx

```tsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
```

### src/client/pages/HomePage.tsx

```tsx
import { useEffect, useState } from "react";

export default function HomePage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{message}</h1>
    </div>
  );
}
```

---

## ステップ10: package.json にスクリプトを追加

```json
{
  "scripts": {
    "dev": "vite",
    "dev:worker": "wrangler dev",
    "build": "vite build",
    "deploy": "vite build && wrangler deploy",
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply my-app-db --local",
    "db:migrate:remote": "wrangler d1 migrations apply my-app-db --remote"
  }
}
```

---

## ステップ11: DBマイグレーションを実行する

```bash
# schema.ts からマイグレーションSQL生成
npm run db:generate

# ローカルのD1に適用
npm run db:migrate:local
```

---

## ステップ12: ローカルで動作確認

```bash
# バックエンド + フロントエンド両方動く
npm run dev:worker
```

http://localhost:8787 にアクセスして動くか確認。

---

## ステップ13: デプロイ

```bash
# 本番DBにマイグレーション適用
npm run db:migrate:remote

# デプロイ
npm run deploy
```

`https://my-app.<your-subdomain>.workers.dev` にアプリが公開される。

---

## 開発の流れまとめ

```text
1. schema.ts にテーブル追加・変更
2. npm run db:generate → マイグレーション生成
3. npm run db:migrate:local → ローカルDBに反映
4. src/worker/routes/ にAPIを書く
5. src/client/pages/ にUIを書く
6. npm run dev:worker で動作確認
7. npm run db:migrate:remote → 本番DBに反映
8. npm run deploy → デプロイ
```

---

## 困ったときに見るべきドキュメント

- Hono（APIフレームワーク）: https://hono.dev
- Drizzle ORM: https://orm.drizzle.team
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- React: https://react.dev
- Vite: https://vitejs.dev
- TailwindCSS: https://tailwindcss.com

---

## 知っておくと良い概念

### Workers とは
Cloudflareのエッジサーバー上で動くJavaScript実行環境。従来の「サーバーを借りてNode.jsを動かす」代わりに、世界中のCDNノードでコードが動く。サーバー管理不要。

### D1 とは
CloudflareのマネージドSQLiteデータベース。Workersから直接アクセスできる。無料枠あり。

### Hono とは
Workers上で動く軽量Webフレームワーク。Express.jsを知っていれば同じ感覚で書ける。`app.get()`, `app.post()` でルート定義、`c.json()` でレスポンス返却。

### Drizzle ORM とは
TypeScriptでDBを型安全に操作するツール。schema.tsにテーブルを定義すると、TypeScriptの型が自動で付く。SQLを直書きするよりミスが減る。

### Vite とは
フロントエンドのビルドツール兼開発サーバー。ReactのTSX/JSXをブラウザで動くJSに変換する。ホットリロード（コード変更が即反映）付き。
