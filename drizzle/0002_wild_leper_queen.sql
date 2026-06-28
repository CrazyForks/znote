CREATE TABLE `note_shares` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`share_id` text NOT NULL,
	`password` text,
	`expires_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `note_shares_share_id_unique` ON `note_shares` (`share_id`);--> statement-breakpoint
CREATE INDEX `idx_note_shares_note` ON `note_shares` (`note_id`);--> statement-breakpoint
CREATE INDEX `idx_note_shares_user` ON `note_shares` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_note_shares_share_id` ON `note_shares` (`share_id`);