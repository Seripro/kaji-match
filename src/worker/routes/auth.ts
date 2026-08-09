import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../auth";
import type { Env } from "../index";

export const authRoutes = new Hono<Env>();

authRoutes.post("/register", async (c) => {
  const db = createDb(c.env.DB);
  const { username, password, nickname } = await c.req.json<{
    username: string;
    password: string;
    nickname: string;
  }>();

  if (!username.trim() || !password || !nickname.trim()) {
    return c.json({ error: "すべての項目を入力してください" }, 400);
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existing) {
    return c.json({ error: "このユーザーネームは既に使われています" }, 400);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    id,
    username,
    passwordHash,
    nickname,
  });

  return c.json({ user: { id, username, nickname } });
});

authRoutes.post("/login", async (c) => {
  const db = createDb(c.env.DB);
  const { username, password } = await c.req.json<{
    username: string;
    password: string;
  }>();

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return c.json({ error: "ユーザーネームまたはパスワードが正しくありません" }, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "ユーザーネームまたはパスワードが正しくありません" }, 401);
  }

  return c.json({ user: { id: user.id, username: user.username, nickname: user.nickname } });
});
