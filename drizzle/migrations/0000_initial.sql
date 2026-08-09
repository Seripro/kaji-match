CREATE TABLE `groups` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `invite_code` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX `groups_invite_code_unique` ON `groups` (`invite_code`);

CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `group_id` text NOT NULL REFERENCES `groups`(`id`),
  `name` text NOT NULL,
  `role` text NOT NULL,
  `points` integer NOT NULL DEFAULT 0,
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
  `status` text NOT NULL DEFAULT 'pending',
  `claimed_at` text NOT NULL DEFAULT (datetime('now')),
  `approved_at` text
);
