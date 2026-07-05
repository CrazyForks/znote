CREATE TABLE `global_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `global_settings_key_unique` ON `global_settings` (`key`);--> statement-breakpoint
ALTER TABLE `notes` ADD `allow_vectorize` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` ADD `is_vectorized` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `notes` ADD `vectorized_at` integer;