import { NextResponse } from "next/server";
import { sql, desc, eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { papers, refreshLog, sourcesState, emailDigestPrefs } from "@/lib/db/schema";
import { getFetcher } from "@/lib/sources/index";
import { PUBMED_TOPIC_QUERY, isClinicallyRelevant } from "@/lib/topics";
import { computeReading } from "@/lib/reading";
import { summarisePaper, getGroq } from "@/lib/ai";
import { sendDigest, type DigestPaper } from "@/lib/email";
import { sendPushTo } from "@/lib/push";
import { pushSubscriptions } from "@/lib/db/schema";

const SOURCE_LABEL: Record<string, string> = {
  pubmed: "PubMed",
  openalex: "OpenAlex",
  europepmc: "Europe PMC",
  medrxiv: "medRxiv",
  semanticscholar: "Semantic Scholar",
  crossref: "Crossref",
};

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
          if (!isClinicallyRelevant(r.abstract)) continue;
          let bluf: string | null = firstSentence(r.abstract) ?? r.title;
          let clinicalImplications: string | null = null;
          let blufIsAi = false;
          if (aiAvailable && r.abstract && r.abstract.length > 200) {
            const ai = await summarisePaper({
              title: r.title,
              abstract: r.abstract,
            });
            if (ai && "skip" in ai) continue;
            if (ai && "bluf" in ai) {
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

  // After refresh: send digests + push notifications.
  let emailSummary: { sent: number; failed: number } = { sent: 0, failed: 0 };
  let pushSummary: { sent: number; failed: number } = { sent: 0, failed: 0 };
  try {
    emailSummary = await sendMonthlyDigest();
  } catch (e) {
    console.error("[cron] email digest failed:", e);
  }
  try {
    pushSummary = await sendMonthlyPush(
      Object.values(summary).reduce((a, b) => a + b.added, 0)
    );
  } catch (e) {
    console.error("[cron] push failed:", e);
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    summary,
    emailSummary,
    pushSummary,
  });
}

async function sendMonthlyPush(
  newPapersCount: number
): Promise<{ sent: number; failed: number }> {
  if (newPapersCount === 0) return { sent: 0, failed: 0 };
  const db = getDb();
  const subs = await db.select().from(pushSubscriptions);
  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    const r = await sendPushTo(s, {
      title: "🌸 Knowledge Bud",
      body: `${newPapersCount} new papers in your topics this month`,
      url: "/feed",
    });
    if (r.ok) sent++;
    else failed++;
  }
  return { sent, failed };
}

async function sendMonthlyDigest(): Promise<{ sent: number; failed: number }> {
  const db = getDb();
  // Top 8 newest papers across all sources.
  const recent = await db
    .select()
    .from(papers)
    .orderBy(desc(papers.fetchedAt))
    .limit(8);
  if (recent.length === 0) return { sent: 0, failed: 0 };

  const digestPapers: DigestPaper[] = recent.map((p) => ({
    title: p.title,
    bluf: p.bluf,
    clinicalImplications: p.clinicalImplications,
    source: SOURCE_LABEL[p.sourceSlug] ?? p.sourceSlug,
    journal: p.journal,
    year: p.year,
    evidence: p.evidence !== "unknown" ? p.evidence : null,
    url: p.url,
    topics: p.topics ?? [],
  }));

  const subs = await db
    .select()
    .from(emailDigestPrefs)
    .where(eq(emailDigestPrefs.monthlyDigest, true));
  let sent = 0;
  let failed = 0;
  for (const sub of subs) {
    const r = await sendDigest({ to: sub.email, papers: digestPapers });
    if (r.ok) sent++;
    else failed++;
  }
  return { sent, failed };
}

function firstSentence(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(/.+?[.!?](?:\s|$)/);
  return m ? m[0].trim() : text.slice(0, 200).trim();
}
