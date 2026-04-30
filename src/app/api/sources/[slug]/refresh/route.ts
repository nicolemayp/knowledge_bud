import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getSource } from "@/lib/sources";
import { getUserId } from "@/lib/auth";
import { getDb, hasDb } from "@/lib/db/client";
import { papers, refreshLog, sourcesState } from "@/lib/db/schema";
import { getFetcher } from "@/lib/sources/index";
import { PUBMED_TOPIC_QUERY, isClinicallyRelevant } from "@/lib/topics";
import { computeReading } from "@/lib/reading";
import { summarisePaper, getGroq } from "@/lib/ai";

// We only run a small subset of topics on a manual refresh to stay polite
// to upstream APIs. Cron uses the full topic list.
const QUICK_TOPICS = [
  "cbt", "dbt", "trauma", "ptsd", "depression", "anxiety",
  "mindfulness", "adolescent", "attention", "neuroplasticity",
];

export const maxDuration = 60;

/** POST /api/sources/[slug]/refresh — manual refresh by the user. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const source = getSource(slug);
  if (!source) {
    return NextResponse.json({ error: "Unknown source" }, { status: 404 });
  }

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!hasDb()) {
    return NextResponse.json(
      { error: "Database not connected — set DATABASE_URL to enable refresh." },
      { status: 503 }
    );
  }

  const fetcher = getFetcher(slug);
  if (!fetcher) {
    return NextResponse.json(
      {
        error: `Fetcher for ${source.name} hasn't shipped yet — coming next iteration.`,
      },
      { status: 501 }
    );
  }

  const db = getDb();
  const [logRow] = await db
    .insert(refreshLog)
    .values({ sourceSlug: slug, kind: "manual", userId })
    .returning({ id: refreshLog.id });

  const aiAvailable = Boolean(getGroq());
  let added = 0;
  let summarised = 0;

  try {
    for (const topicKey of QUICK_TOPICS) {
      const query = PUBMED_TOPIC_QUERY[topicKey];
      if (!query) continue;

      let records;
      try {
        records = await fetcher(query, { sinceDays: 35, max: 3 });
      } catch (e) {
        console.warn(`[refresh] ${slug}/${topicKey} failed:`, e);
        continue;
      }

      for (const r of records) {
        // Skip preclinical / animal-only papers — they slip past [mh] tags
        if (!isClinicallyRelevant(r.abstract)) continue;
        // Generate AI BLUF + clinical implications when Groq is available
        // and we have an abstract to summarise.
        let bluf: string | null = firstSentence(r.abstract) ?? r.title;
        let clinicalImplications: string | null = null;
        let blufIsAi = false;
        if (aiAvailable && r.abstract && r.abstract.length > 200) {
          const ai = await summarisePaper({
            title: r.title,
            abstract: r.abstract,
            evidence: source.reliability,
          });
          if (ai && "skip" in ai) continue; // AI judged non-clinical
          if (ai && "bluf" in ai) {
            bluf = ai.bluf;
            clinicalImplications = ai.clinicalImplications;
            blufIsAi = true;
            summarised++;
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
        if (result.length > 0) added++;
      }

      await new Promise((r) => setTimeout(r, 250));
    }

    await db
      .insert(sourcesState)
      .values({
        slug,
        requestsToday: QUICK_TOPICS.length,
        requestsThisMonth: QUICK_TOPICS.length,
        lastRefreshAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sourcesState.slug,
        set: {
          requestsToday: sql`${sourcesState.requestsToday} + ${QUICK_TOPICS.length}`,
          requestsThisMonth: sql`${sourcesState.requestsThisMonth} + ${QUICK_TOPICS.length}`,
          lastRefreshAt: new Date(),
        },
      });

    await db
      .update(refreshLog)
      .set({ finishedAt: new Date(), papersAdded: added })
      .where(sql`${refreshLog.id} = ${logRow.id}`);

    return NextResponse.json({
      ok: true,
      added,
      summarised,
      aiUsed: aiAvailable,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Refresh failed";
    await db
      .update(refreshLog)
      .set({ finishedAt: new Date(), error: msg })
      .where(sql`${refreshLog.id} = ${logRow.id}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function firstSentence(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(/.+?[.!?](?:\s|$)/);
  return m ? m[0].trim() : text.slice(0, 200).trim();
}
