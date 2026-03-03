CREATE TABLE `alfa_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`api_key` text NOT NULL,
	`token` text,
	`token_expires_at` integer
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY NOT NULL,
	`alfacrm_id` integer NOT NULL,
	`name` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teacher_subjects` (
	`teacher_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` integer PRIMARY KEY NOT NULL,
	`alfacrm_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`avatar_url` text,
	`note` text
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