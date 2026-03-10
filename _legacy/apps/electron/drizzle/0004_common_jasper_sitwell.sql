PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subjects` (
	`id` integer PRIMARY KEY NOT NULL,
	`alfacrm_id` integer,
	`name` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_subjects`("id", "alfacrm_id", "name", "order") SELECT "id", "alfacrm_id", "name", "order" FROM `subjects`;--> statement-breakpoint
DROP TABLE `subjects`;--> statement-breakpoint
ALTER TABLE `__new_subjects` RENAME TO `subjects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;