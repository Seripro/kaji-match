import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { users, memberships, taskClaims } from "../db/schema";
import { hashPassword } from "../auth";
import type { Env } from "../index";

export const userRoutes = new Hono<Env>();

userRoutes.get("/:id/points/:groupId", async (c) => {
  const db = createDb(c.env.DB);
  const userId = c.req.param("id");
  const groupId = c.req.param("groupId");

  const claims = await db.query.taskClaims.findMany({
    where: and(eq(taskClaims.userId, userId), eq(taskClaims.status, "approved")),
  });

  const { tasks } = await import("../db/schema");
  const groupTasks = await db.query.tasks.findMany({
    where: eq(tasks.groupId, groupId),
  });
  const groupTaskIds = new Set(groupTasks.map((t) => t.id));

  const points = claims
    .filter((cl) => groupTaskIds.has(cl.taskId))
    .reduce((sum, cl) => sum + cl.points, 0);

  return c.json({ points });
});

userRoutes.post("/:id/reset-password", async (c) => {
  const db = createDb(c.env.DB);
  const targetUserId = c.req.param("id");
  const { adminId, groupId, newPassword } = await c.req.json<{
    adminId: string;
    groupId: string;
    newPassword: string;
  }>();

  const adminMembership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, adminId), eq(memberships.groupId, groupId), eq(memberships.role, "admin")),
  });

  if (!adminMembership) {
    return c.json({ error: "管理者権限がありません" }, 403);
  }

  const targetMembership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, targetUserId), eq(memberships.groupId, groupId)),
  });

  if (!targetMembership) {
    return c.json({ error: "同じグループのメンバーではありません" }, 403);
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, targetUserId));

  return c.json({ success: true });
});
