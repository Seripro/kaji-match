import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  role: text("role", { enum: ["admin", "member"] }).notNull(),
  status: text("status", { enum: ["pending", "approved"] })
    .notNull()
    .default("pending"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  points: integer("points").notNull(),
  status: text("status", { enum: ["open", "pending", "completed"] })
    .notNull()
    .default("open"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const taskClaims = sqliteTable("task_claims", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  comment: text("comment").notNull().default(""),
  points: integer("points").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  claimedAt: text("claimed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  approvedAt: text("approved_at"),
});
