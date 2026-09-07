CREATE TABLE `feedback` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text,
  `rating` integer NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `message` text NOT NULL,
  `contact_allowed` integer DEFAULT false NOT NULL,
  `status` text DEFAULT 'new' NOT NULL CHECK (`status` IN ('new', 'reviewed', 'archived')),
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_feedback_status_created` ON `feedback` (`status`, `created_at`);
--> statement-breakpoint
PRAGMA optimize;
