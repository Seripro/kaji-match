import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { groups, memberships, users } from "../db/schema";
import type { Env } from "../index";

export const groupRoutes = new Hono<Env>();

groupRoutes.post("/", async (c) => {
  const db = createDb(c.env.DB);
  const { name, userId } = await c.req.json<{
    name: string;
    userId: string;
  }>();

  const groupId = crypto.randomUUID();
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  await db.insert(groups).values({
    id: groupId,
    name,
    inviteCode,
  });

  await db.insert(memberships).values({
    id: crypto.randomUUID(),
    userId,
    groupId,
    role: "admin",
    status: "approved",
  });

  return c.json({ group: { id: groupId, name, inviteCode } });
});

groupRoutes.post("/join", async (c) => {
  const db = createDb(c.env.DB);
  const { inviteCode, userId } = await c.req.json<{
    inviteCode: string;
    userId: string;
  }>();

  const group = await db.query.groups.findFirst({
    where: eq(groups.inviteCode, inviteCode.toUpperCase()),
  });

  if (!group) {
    return c.json({ error: "招待コードが見つかりません" }, 404);
  }

  const existing = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, userId), eq(memberships.groupId, group.id)),
  });

  if (existing) {
    return c.json({ error: "既にこのグループに参加または申請済みです" }, 400);
  }

  await db.insert(memberships).values({
    id: crypto.randomUUID(),
    userId,
    groupId: group.id,
    role: "member",
    status: "pending",
  });

  return c.json({ group: { id: group.id, name: group.name }, status: "pending" });
});

groupRoutes.get("/my/:userId", async (c) => {
  const db = createDb(c.env.DB);
  const userId = c.req.param("userId");

  const myMemberships = await db.query.memberships.findMany({
    where: and(eq(memberships.userId, userId), eq(memberships.status, "approved")),
  });

  const result = [];
  for (const m of myMemberships) {
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, m.groupId),
    });
    if (group) {
      result.push({ ...group, role: m.role });
    }
  }

  return c.json({ groups: result });
});

groupRoutes.get("/:id", async (c) => {
  const db = createDb(c.env.DB);
  const groupId = c.req.param("id");

  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
  });

  if (!group) {
    return c.json({ error: "グループが見つかりません" }, 404);
  }

  const allMemberships = await db.query.memberships.findMany({
    where: and(eq(memberships.groupId, groupId), eq(memberships.status, "approved")),
  });

  const members = [];
  for (const m of allMemberships) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, m.userId),
    });
    if (user) {
      members.push({ id: user.id, nickname: user.nickname, username: user.username, role: m.role });
    }
  }

  return c.json({ group, members });
});

groupRoutes.get("/:id/pending", async (c) => {
  const db = createDb(c.env.DB);
  const groupId = c.req.param("id");

  const pending = await db.query.memberships.findMany({
    where: and(eq(memberships.groupId, groupId), eq(memberships.status, "pending")),
  });

  const result = [];
  for (const m of pending) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, m.userId),
    });
    if (user) {
      result.push({ membershipId: m.id, userId: user.id, nickname: user.nickname, username: user.username, createdAt: m.createdAt });
    }
  }

  return c.json({ pending: result });
});

groupRoutes.post("/:id/approve", async (c) => {
  const db = createDb(c.env.DB);
  const groupId = c.req.param("id");
  const { membershipId, adminId } = await c.req.json<{
    membershipId: string;
    adminId: string;
  }>();

  const adminMembership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, adminId), eq(memberships.groupId, groupId), eq(memberships.role, "admin")),
  });

  if (!adminMembership) {
    return c.json({ error: "管理者権限がありません" }, 403);
  }

  await db.update(memberships).set({ status: "approved" }).where(eq(memberships.id, membershipId));

  return c.json({ success: true });
});

groupRoutes.post("/:id/reject", async (c) => {
  const db = createDb(c.env.DB);
  const groupId = c.req.param("id");
  const { membershipId, adminId } = await c.req.json<{
    membershipId: string;
    adminId: string;
  }>();

  const adminMembership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, adminId), eq(memberships.groupId, groupId), eq(memberships.role, "admin")),
  });

  if (!adminMembership) {
    return c.json({ error: "管理者権限がありません" }, 403);
  }

  await db.delete(memberships).where(eq(memberships.id, membershipId));

  return c.json({ success: true });
});
