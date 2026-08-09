import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { createDb } from "../db";
import { taskClaims, tasks, users, memberships } from "../db/schema";
import type { Env } from "../index";

export const claimRoutes = new Hono<Env>();

claimRoutes.post("/", async (c) => {
  const db = createDb(c.env.DB);
  const { taskId, userId, comment } = await c.req.json<{
    taskId: string;
    userId: string;
    comment: string;
  }>();

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) {
    return c.json({ error: "タスクが見つかりません" }, 404);
  }

  if (task.status !== "open") {
    return c.json({ error: "このタスクは既に申請済みです" }, 400);
  }

  const claimId = crypto.randomUUID();
  await db.insert(taskClaims).values({
    id: claimId,
    taskId,
    userId,
    comment: comment || "",
    points: task.points,
    status: "pending",
  });

  await db.update(tasks).set({ status: "pending" }).where(eq(tasks.id, taskId));

  return c.json({ claim: { id: claimId, taskId, userId, comment, status: "pending" } });
});

claimRoutes.get("/group/:groupId", async (c) => {
  const db = createDb(c.env.DB);
  const groupId = c.req.param("groupId");
  const status = c.req.query("status");

  const groupTasks = await db.query.tasks.findMany({
    where: eq(tasks.groupId, groupId),
  });

  const taskIds = groupTasks.map((t) => t.id);
  if (taskIds.length === 0) {
    return c.json({ claims: [] });
  }

  const allClaims = await db.query.taskClaims.findMany();
  let filtered = allClaims.filter((claim) => taskIds.includes(claim.taskId));

  if (status) {
    filtered = filtered.filter((claim) => claim.status === status);
  }

  const claimsWithDetails = [];
  for (const claim of filtered) {
    const task = groupTasks.find((t) => t.id === claim.taskId);
    const user = await db.query.users.findFirst({
      where: eq(users.id, claim.userId),
    });
    claimsWithDetails.push({ ...claim, task, user: user ? { id: user.id, nickname: user.nickname } : null });
  }

  return c.json({ claims: claimsWithDetails });
});

claimRoutes.get("/user/:userId", async (c) => {
  const db = createDb(c.env.DB);
  const userId = c.req.param("userId");

  const claims = await db.query.taskClaims.findMany({
    where: eq(taskClaims.userId, userId),
  });

  const result = [];
  for (const claim of claims) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, claim.taskId),
    });
    result.push({ ...claim, task: task ? { title: task.title, points: task.points } : null });
  }

  return c.json({ claims: result });
});

claimRoutes.post("/:id/approve", async (c) => {
  const db = createDb(c.env.DB);
  const claimId = c.req.param("id");

  const claim = await db.query.taskClaims.findFirst({
    where: eq(taskClaims.id, claimId),
  });

  if (!claim) {
    return c.json({ error: "申請が見つかりません" }, 404);
  }

  if (claim.status !== "pending") {
    return c.json({ error: "この申請は既に処理済みです" }, 400);
  }

  await db
    .update(taskClaims)
    .set({ status: "approved", approvedAt: new Date().toISOString() })
    .where(eq(taskClaims.id, claimId));

  await db.update(tasks).set({ status: "completed" }).where(eq(tasks.id, claim.taskId));

  return c.json({ success: true, pointsAwarded: claim.points });
});

claimRoutes.post("/:id/reject", async (c) => {
  const db = createDb(c.env.DB);
  const claimId = c.req.param("id");

  const claim = await db.query.taskClaims.findFirst({
    where: eq(taskClaims.id, claimId),
  });

  if (!claim) {
    return c.json({ error: "申請が見つかりません" }, 404);
  }

  await db.update(taskClaims).set({ status: "rejected" }).where(eq(taskClaims.id, claimId));
  await db.update(tasks).set({ status: "open" }).where(eq(tasks.id, claim.taskId));

  return c.json({ success: true });
});
