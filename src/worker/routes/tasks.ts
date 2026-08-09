import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { tasks, memberships } from "../db/schema";
import type { Env } from "../index";

export const taskRoutes = new Hono<Env>();

taskRoutes.post("/", async (c) => {
  const db = createDb(c.env.DB);
  const { groupId, title, description, points, createdBy } = await c.req.json<{
    groupId: string;
    title: string;
    description: string;
    points: number;
    createdBy: string;
  }>();

  const membership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, createdBy), eq(memberships.groupId, groupId), eq(memberships.role, "admin")),
  });

  if (!membership) {
    return c.json({ error: "管理者権限がありません" }, 403);
  }

  const taskId = crypto.randomUUID();
  await db.insert(tasks).values({
    id: taskId,
    groupId,
    title,
    description: description || "",
    points,
    status: "open",
    createdBy,
  });

  return c.json({ task: { id: taskId, groupId, title, description, points, status: "open" } });
});

taskRoutes.get("/group/:groupId", async (c) => {
  const db = createDb(c.env.DB);
  const groupId = c.req.param("groupId");
  const status = c.req.query("status");

  let result;
  if (status) {
    result = await db.query.tasks.findMany({
      where: and(eq(tasks.groupId, groupId), eq(tasks.status, status as "open" | "pending" | "completed")),
    });
  } else {
    result = await db.query.tasks.findMany({
      where: eq(tasks.groupId, groupId),
    });
  }

  return c.json({ tasks: result });
});
