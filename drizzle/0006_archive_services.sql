ALTER TABLE `services` ADD `archived` integer DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE INDEX `idx_services_catalog` ON `services` (`archived`, `active`, `price_cents`, `name`);
--> statement-breakpoint
PRAGMA optimize;
