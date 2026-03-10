CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`parent_id` integer,
	`created_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `snippets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`variables` text DEFAULT '[]',
	`category_id` integer NOT NULL,
	`favorite` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	`color` text DEFAULT '#FFFFFF',
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);