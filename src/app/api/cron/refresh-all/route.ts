import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { papers, refreshLog, sourcesState } from "@/lib/db/schema";
import { getFetcher } from "@/lib/sources/index";
import { PUBMED_TOPIC_QUERY } from "@/lib/topics";
import { computeReading } from "@/lib/reading";
import { summarisePaper, getGroq } from "@/lib/ai";

// All sources we have live fetchers for.
const SOURCES = ["pubmed", "openalex", "europepmc", "medrxiv"] as const;

// On cron, hit the broader "monthly" topic set (vs Quick on manual refresh).
const CRON_TOPICS = [
  "cbt", "dbt", "act", "emdr", "ifs", "somatic", "polyvagal",
  "music", "art", "play", "mi", "cft", "mbsr",
  "attention", "neuroplasticity", "default-mode", "stress", "sleep",
  "interoception", "habit", "psychedelics", "psychopharm",
  "alliance", "burnout", "trauma-informed", "self-compassion", "attachment",
  "trauma", "ptsd", "complex-ptsd", "depression", "anxiety", "ocd",
  "bipolar", "bpd", "adhd", "autism", "eating", "addiction",
  "suicide", "grief",
  "adolescent", "child", "family", "couples", "perinatal",
  "veterans", "first-responders", "neurodiversity",
  "loneliness", "exercise",
];

export const maxDuration = 300; // 5 min — Vercel max for hobby plan

/**
 * Vercel Cron — `0 0 1 * *` (midnight UTC, 1st of month).
 * Vercel sets `Authorization: Bearer ${CRON_SECRET}` for security.
 * https://vercel.com/docs/cron-jobs#securing-cron-jobs
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  const db = getDb();
  const aiAvailable = Boolean(getGroq());
  const summary: Record<string, { added: number; errors: number }> = {};

  for (const slug of SOURCES) {
    const fetcher = getFetcher(slug);
    if (!fetcher) continue;

    summary[slug] = { added: 0, errors: 0 };
    const [logRow] = await db
      .insert(refreshLog)
      .values({ sourceSlug: slug, kind: "cron" })
      .returning({ id: refreshLog.id });

    try {
      for (const topicKey of CRON_TOPICS) {
        const query = PUBMED_TOPIC_QUERY[topicKey];
        if (!query) continue;
        let records;
        try {
          records = await fetcher(query, { sinceDays: 35, max: 2 });
        } catch {
          summary[slug].errors++;
          continue;
        }
        for (const r of records) {
          let bluf: string | null = firstSentence(r.abstract) ?? r.title;
          let clinicalImplications: string | null = null;
          let blufIsAi = false;
          if (aiAvailable && r.abstract && r.abstract.length > 200) {
            const ai = await summarisePaper({
              title: r.title,
              abstract: r.abstract,
            });
            if (ai) {
              bluf = ai.bluf;
              clinicalImplications = ai.clinicalImplications;
              blufIsAi = true;
            }
          }
          const { readingMinutes, jargon } = computeReading(r.abstract);
          const result = await db
            .insert(papers)
            .values({
              sourceSlug: slug,
              externalId: r.externalId,
              doi: r.doi ?? null,
              title: r.title,
              authors: r.authors,
              journal: r.journal ?? null,
              year: r.year ?? null,
              abstract: r.abstract ?? null,
              bluf,
              clinicalImplications,
              blufIsAi,
              url: r.url,
              topics: [topicKey],
              readingMinutes,
              jargon: jargon ?? null,
              evidence: "unknown",
              keyStats: [],
              publishedAt: r.publishedAt ?? null,
            })
            .onConflictDoNothing()
            .returning({ id: papers.id });
          if (result.length > 0) summary[slug].added++;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      await db
        .insert(sourcesState)
        .values({
          slug,
          requestsToday: CRON_TOPICS.length,
          requestsThisMonth: CRON_TOPICS.length,
          lastRefreshAt: new Date(),
        })
        .onConflictDoUpdate({
          target: sourcesState.slug,
          set: {
            requestsToday: sql`${sourcesState.requestsToday} + ${CRON_TOPICS.length}`,
            requestsThisMonth: sql`${sourcesState.requestsThisMonth} + ${CRON_TOPICS.length}`,
            lastRefreshAt: new Date(),
          },
        });

      await db
        .update(refreshLog)
        .set({ finishedAt: new Date(), papersAdded: summary[slug].added })
        .where(sql`${refreshLog.id} = ${logRow.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cron failed";
      await db
        .update(refreshLog)
        .set({ finishedAt: new Date(), error: msg })
        .where(sql`${refreshLog.id} = ${logRow.id}`);
    }
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    summary,
  });
}

function firstSentence(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(/.+?[.!?](?:\s|$)/);
  return m ? m[0].trim() : text.slice(0, 200).trim();
}
