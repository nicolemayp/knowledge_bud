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
import { pushSubscriptions, podcastEpisodes } from "@/lib/db/schema";
import {
  generateScript,
  scriptToAudio,
  uploadAudio,
  currentMonthKey,
  monthLabel as monthLabelFn,
  estimateDurationSec,
  type ScriptPaper,
} from "@/lib/podcast";

const SOURCE_LABEL: Record<string, string> = {
  pubmed: "PubMed",
  openalex: "OpenAlex",
  europepmc: "Europe PMC",
  medrxiv: "medRxiv",
  semanticscholar: "Semantic Scholar",
  crossref: "Crossref",
};

// PubMed-only for cron (other sources need different query syntax — TODO).
// PubMed E-utilities allows 3 req/s without API key, 10 req/s with.
const SOURCES = ["pubmed"] as const;

// Smaller curated topic set so we fit Groq's TPM rate limits comfortably.
// (Groq llama-3.3-70b: ~30 RPM, ~12k TPM on free tier.)
const CRON_TOPICS = [
  "cbt", "dbt", "act", "emdr", "ifs", "somatic", "polyvagal",
  "mbsr", "mi", "cft",
  "music", "art", "play",
  "attention", "neuroplasticity", "sleep", "stress", "attachment",
  "alliance", "burnout", "trauma-informed",
  "trauma", "ptsd", "complex-ptsd", "depression", "anxiety", "ocd",
  "bpd", "adhd", "eating", "addiction", "suicide", "grief",
  "adolescent", "perinatal", "couples", "older-adults",
  "psychedelics",
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
            // Pace ~3s/call to stay under Groq's TPM cap on free tier.
            const ai = await summarisePaper({
              title: r.title,
              abstract: r.abstract,
            });
            if (ai && "skip" in ai) {
              // AI judged non-clinical — pace then skip
              await new Promise((r) => setTimeout(r, 3000));
              continue;
            }
            if (ai && "bluf" in ai) {
              bluf = ai.bluf;
              clinicalImplications = ai.clinicalImplications;
              blufIsAi = true;
            }
            await new Promise((r) => setTimeout(r, 3000));
          }
          // If we don't have AI-generated implications, skip this paper —
          // we'd rather have fewer rich papers than many empty ones.
          if (!clinicalImplications) continue;
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
        // Bigger pause between topics so PubMed doesn't 429 us.
        await new Promise((r) => setTimeout(r, 800));
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

  // After refresh: send digests + push + generate this month's podcast.
  let emailSummary: { sent: number; failed: number } = { sent: 0, failed: 0 };
  let pushSummary: { sent: number; failed: number } = { sent: 0, failed: 0 };
  let podcastSummary: { ok: boolean; audioUrl?: string; error?: string } = {
    ok: false,
  };
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
  try {
    podcastSummary = await generateMonthlyPodcast();
  } catch (e) {
    console.error("[cron] podcast failed:", e);
    podcastSummary = { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    summary,
    emailSummary,
    pushSummary,
    podcastSummary,
  });
}

async function generateMonthlyPodcast(): Promise<{
  ok: boolean;
  audioUrl?: string;
  error?: string;
}> {
  const db = getDb();
  const recent = await db
    .select()
    .from(papers)
    .orderBy(desc(papers.fetchedAt))
    .limit(8);
  if (recent.length === 0) return { ok: false, error: "No papers" };

  const sources: ScriptPaper[] = recent.map((p) => ({
    title: p.title,
    bluf: p.bluf,
    clinicalImplications: p.clinicalImplications,
    journal: p.journal,
    year: p.year,
    evidence: p.evidence !== "unknown" ? p.evidence : null,
  }));

  const monthKey = currentMonthKey();
  const month = monthLabelFn();

  const script = await generateScript({ papers: sources, monthLabel: month });
  if (!script) return { ok: false, error: "Script failed" };

  const audio = await scriptToAudio(script);
  if (!audio) return { ok: false, error: "TTS failed" };

  const audioUrl = await uploadAudio({ monthKey, buffer: audio });
  if (!audioUrl) return { ok: false, error: "Upload failed" };

  const duration = estimateDurationSec(script);
  const description = script.split(/\n\s*\n/)[0]?.replace(/\s+/g, " ").trim().slice(0, 240) ?? null;

  await db
    .insert(podcastEpisodes)
    .values({
      monthKey,
      title: `Knowledge Bud — ${month}`,
      description,
      script,
      audioUrl,
      durationSec: duration,
      paperIds: recent.map((r) => r.id),
      status: "ready",
    })
    .onConflictDoUpdate({
      target: podcastEpisodes.monthKey,
      set: {
        title: `Knowledge Bud — ${month}`,
        description,
        script,
        audioUrl,
        durationSec: duration,
        paperIds: recent.map((r) => r.id),
        status: "ready",
      },
    });

  return { ok: true, audioUrl };
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
