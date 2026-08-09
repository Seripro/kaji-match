DROP TABLE IF EXISTS `task_claims`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `groups`;

CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `username` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `nickname` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE `groups` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `invite_code` text NOT NULL UNIQUE,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE `memberships` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `group_id` text NOT NULL REFERENCES `groups`(`id`),
  `role` text NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE `tasks` (
  `id` text PRIMARY KEY NOT NULL,
  `group_id` text NOT NULL REFERENCES `groups`(`id`),
  `title` text NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `points` integer NOT NULL,
  `status` text NOT NULL DEFAULT 'open',
  `created_by` text NOT NULL REFERENCES `users`(`id`),
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE `task_claims` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL REFERENCES `tasks`(`id`),
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `comment` text NOT NULL DEFAULT '',
  `points` integer NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `claimed_at` text NOT NULL DEFAULT (datetime('now')),
  `approved_at` text
);
