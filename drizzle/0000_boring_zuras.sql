CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_comments_post` ON `comments` (`post_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mime` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`author` text NOT NULL,
	`kind` text NOT NULL,
	`destination` text NOT NULL,
	`state` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`rating` integer NOT NULL,
	`price` integer,
	`visited` text NOT NULL,
	`trip_type` text NOT NULL,
	`photos` text DEFAULT '[]' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_posts_created` ON `posts` (`created`);--> statement-breakpoint
CREATE INDEX `idx_posts_destination` ON `posts` (`destination`);--> statement-breakpoint
CREATE INDEX `idx_posts_user` ON `posts` (`user_id`);--> statement-breakpoint
CREATE TABLE `saves` (
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`collection` text NOT NULL,
	PRIMARY KEY(`post_id`, `user_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_saves_user` ON `saves` (`user_id`);--> statement-breakpoint
CREATE TABLE `votes` (
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	PRIMARY KEY(`post_id`, `user_id`, `kind`)
);
