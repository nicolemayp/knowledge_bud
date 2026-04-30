CREATE TABLE "login_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "podcast_episodes" (
	"id" text PRIMARY KEY NOT NULL,
	"month_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"script" text,
	"audio_url" text,
	"duration_sec" integer,
	"paper_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "podcast_episodes_month_key_unique" UNIQUE("month_key")
);
