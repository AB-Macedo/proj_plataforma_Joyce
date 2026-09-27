CREATE TABLE `analytics_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `event_type` text NOT NULL CHECK (`event_type` IN ('page_view','booking_interest','schedule_view')),
  `session_id` text NOT NULL,
  `path` text DEFAULT '/' NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_events_type_created` ON `analytics_events` (`event_type`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_analytics_events_session_created` ON `analytics_events` (`session_id`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
