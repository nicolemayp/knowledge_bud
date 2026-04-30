CREATE TYPE "public"."evidence_kind" AS ENUM('rct', 'meta-analysis', 'review', 'cohort', 'case-study', 'qualitative', 'preprint', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."jargon_level" AS ENUM('plain', 'medium', 'heavy');--> statement-breakpoint
CREATE TYPE "public"."refresh_kind" AS ENUM('manual', 'cron');--> statement-breakpoint
CREATE TYPE "public"."topic_kind" AS ENUM('default', 'custom');--> statement-breakpoint
CREATE TYPE "public"."user_kind" AS ENUM('guest', 'registered');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"user_id" text NOT NULL,
	"paper_id" text NOT NULL,
	"folder_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_id_paper_id_pk" PRIMARY KEY("user_id","paper_id")
);
--> statement-breakpoint
CREATE TABLE "email_digest_prefs" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"monthly_digest" boolean DEFAULT true NOT NULL,
	"topic_alerts" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'pink' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "glossary" (
	"id" text PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"category" text,
	CONSTRAINT "glossary_term_unique" UNIQUE("term")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"paper_id" text NOT NULL,
	"body" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" text PRIMARY KEY NOT NULL,
	"source_slug" text NOT NULL,
	"external_id" text NOT NULL,
	"doi" text,
	"title" text NOT NULL,
	"authors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"journal" text,
	"year" integer,
	"abstract" text,
	"bluf" text,
	"bluf_is_ai" boolean DEFAULT false NOT NULL,
	"evidence" "evidence_kind" DEFAULT 'unknown' NOT NULL,
	"key_stats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"url" text NOT NULL,
	"reading_minutes" integer,
	"jargon" "jargon_level",
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "refresh_log" (
	"id" text PRIMARY KEY NOT NULL,
	"source_slug" text NOT NULL,
	"kind" "refresh_kind" NOT NULL,
	"user_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"papers_added" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "sources_state" (
	"slug" text PRIMARY KEY NOT NULL,
	"requests_today" integer DEFAULT 0 NOT NULL,
	"requests_this_month" integer DEFAULT 0 NOT NULL,
	"last_refresh_at" timestamp with time zone,
	"last_reset_day" timestamp with time zone,
	"last_reset_month" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_topics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"kind" "topic_kind" DEFAULT 'default' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "user_kind" DEFAULT 'guest' NOT NULL,
	"email" text,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_digest_prefs" ADD CONSTRAINT "email_digest_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_topics" ADD CONSTRAINT "user_topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notes_user_paper_unique" ON "notes" USING btree ("user_id","paper_id");--> statement-breakpoint
CREATE UNIQUE INDEX "papers_source_external_unique" ON "papers" USING btree ("source_slug","external_id");--> statement-breakpoint
CREATE INDEX "papers_published_idx" ON "papers" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "refresh_log_source_idx" ON "refresh_log" USING btree ("source_slug");--> statement-breakpoint
CREATE INDEX "refresh_log_user_idx" ON "refresh_log" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_topics_user_key_unique" ON "user_topics" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "user_topics_user_idx" ON "user_topics" USING btree ("user_id");