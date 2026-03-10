PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_teachers` (
	`id` integer PRIMARY KEY NOT NULL,
	`alfacrm_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`avatar_url` text,
	`note` text DEFAULT 'Заметка'
);
--> statement-breakpoint
INSERT INTO `__new_teachers`("id", "alfacrm_id", "name", "email", "phone", "avatar_url", "note") SELECT "id", "alfacrm_id", "name", "email", "phone", "avatar_url", "note" FROM `teachers`;--> statement-breakpoint
DROP TABLE `teachers`;--> statement-breakpoint
ALTER TABLE `__new_teachers` RENAME TO `teachers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;