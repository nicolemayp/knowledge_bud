import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

const id = () =>
  text("id")
    .$defaultFn(() => createId())
    .primaryKey();

// ─── ENUMS ────────────────────────────────────────────────────────
export const userKind = pgEnum("user_kind", ["guest", "registered"]);
export const topicKind = pgEnum("topic_kind", ["default", "custom"]);
export const evidenceKind = pgEnum("evidence_kind", [
  "rct",
  "meta-analysis",
  "review",
  "cohort",
  "case-study",
  "qualitative",
  "preprint",
  "unknown",
]);
export const jargonLevel = pgEnum("jargon_level", ["plain", "medium", "heavy"]);
export const refreshKind = pgEnum("refresh_kind", ["manual", "cron"]);

// ─── USERS ────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: id(),
  kind: userKind("kind").notNull().default("guest"),
  email: text("email"),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── TOPICS (per-user) ────────────────────────────────────────────
export const userTopics = pgTable(
  "user_topics",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // normalized lowercase, e.g. "cbt"
    label: text("label").notNull(),
    kind: topicKind("kind").notNull().default("default"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userKeyUnique: uniqueIndex("user_topics_user_key_unique").on(
      t.userId,
      t.key
    ),
    userIdx: index("user_topics_user_idx").on(t.userId),
  })
);

// ─── PAPERS ───────────────────────────────────────────────────────
export const papers = pgTable(
  "papers",
  {
    id: id(),
    sourceSlug: text("source_slug").notNull(), // e.g. "pubmed"
    externalId: text("external_id").notNull(), // PMID, DOI, etc.
    doi: text("doi"),
    title: text("title").notNull(),
    authors: jsonb("authors").$type<string[]>().notNull().default([]),
    journal: text("journal"),
    year: integer("year"),
    abstract: text("abstract"),
    bluf: text("bluf"),                                // 1-sentence takeaway
    clinicalImplications: text("clinical_implications"), // 1–2 sentences for therapists
    blufIsAi: boolean("bluf_is_ai").notNull().default(false),
    evidence: evidenceKind("evidence").notNull().default("unknown"),
    keyStats: jsonb("key_stats")
      .$type<{ label: string; value: string }[]>()
      .notNull()
      .default([]),
    topics: jsonb("topics").$type<string[]>().notNull().default([]),
    url: text("url").notNull(),
    readingMinutes: integer("reading_minutes"),
    jargon: jargonLevel("jargon"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    srcExtUnique: uniqueIndex("papers_source_external_unique").on(
      t.sourceSlug,
      t.externalId
    ),
    publishedIdx: index("papers_published_idx").on(t.publishedAt),
  })
);

// ─── SOURCES STATE (counters) ─────────────────────────────────────
export const sourcesState = pgTable("sources_state", {
  slug: text("slug").primaryKey(),
  requestsToday: integer("requests_today").notNull().default(0),
  requestsThisMonth: integer("requests_this_month").notNull().default(0),
  lastRefreshAt: timestamp("last_refresh_at", { withTimezone: true }),
  lastResetDay: timestamp("last_reset_day", { withTimezone: true }),
  lastResetMonth: timestamp("last_reset_month", { withTimezone: true }),
});

// ─── REFRESH LOG ──────────────────────────────────────────────────
export const refreshLog = pgTable(
  "refresh_log",
  {
    id: id(),
    sourceSlug: text("source_slug").notNull(),
    kind: refreshKind("kind").notNull(),
    userId: text("user_id"), // null for cron
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    papersAdded: integer("papers_added").notNull().default(0),
    error: text("error"),
  },
  (t) => ({
    sourceIdx: index("refresh_log_source_idx").on(t.sourceSlug),
    userIdx: index("refresh_log_user_idx").on(t.userId),
  })
);

// ─── BOOKMARKS / FOLDERS / NOTES ──────────────────────────────────
export const folders = pgTable("folders", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("pink"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.paperId] }),
  })
);

export const notes = pgTable(
  "notes",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userPaperIdx: uniqueIndex("notes_user_paper_unique").on(
      t.userId,
      t.paperId
    ),
  })
);

// ─── GLOSSARY ─────────────────────────────────────────────────────
export const glossary = pgTable("glossary", {
  id: id(),
  term: text("term").notNull().unique(),
  definition: text("definition").notNull(),
  category: text("category"),
});

// ─── PUSH / EMAIL SUBSCRIPTIONS ───────────────────────────────────
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailDigestPrefs = pgTable("email_digest_prefs", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  monthlyDigest: boolean("monthly_digest").notNull().default(true),
  topicAlerts: boolean("topic_alerts").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── MAGIC-LINK AUTH ──────────────────────────────────────────────
export const loginTokens = pgTable("login_tokens", {
  token: text("token").primaryKey(),       // hex, 32+ bytes
  email: text("email").notNull(),
  userId: text("user_id"),                 // populated after first claim
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── PODCAST EPISODES ─────────────────────────────────────────────
export const podcastEpisodes = pgTable("podcast_episodes", {
  id: id(),
  monthKey: text("month_key").notNull().unique(),  // e.g. "2026-05"
  title: text("title").notNull(),
  description: text("description"),
  script: text("script"),                          // full TTS script
  audioUrl: text("audio_url"),                     // URL of the MP3 in Vercel Blob
  durationSec: integer("duration_sec"),
  paperIds: jsonb("paper_ids").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("pending"), // pending | generating | ready | failed
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
