CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant','tool') NOT NULL,
	`content` text NOT NULL,
	`toolName` varchar(128),
	`toolResult` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL DEFAULT 'New Conversation',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeEventId` varchar(128) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`objectId` varchar(128),
	`objectType` varchar(64),
	`status` enum('received','processed','failed') NOT NULL DEFAULT 'received',
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_events_stripeEventId_unique` UNIQUE(`stripeEventId`)
);
