import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getSource } from "@/lib/sources";
import { getUserId } from "@/lib/auth";
import { getDb, hasDb } from "@/lib/db/client";
import { papers, refreshLog, sourcesState } from "@/lib/db/schema";
import { searchPubMed, fetchPubMedRecords } from "@/lib/sources/pubmed";
import { computeReading } from "@/lib/reading";

const TOPIC_QUERY: Record<string, string> = {
  cbt: "(cognitive behavioral therapy[mh] OR CBT[tiab]) AND (depression OR anxiety OR PTSD)",
  dbt: "dialectical behavior therapy[tiab] OR DBT[tiab]",
  trauma: "trauma[tiab] OR traumatic[tiab]",
  ptsd: "PTSD[tiab] OR post-traumatic stress[tiab]",
  depression: "major depressive disorder[mh] OR depression[tiab]",
  anxiety: "anxiety disorders[mh] OR anxiety[tiab]",
  mindfulness: "mindfulness[tiab] OR meditation[tiab]",
  adolescent: "adolescent[mh] AND (mental health[tiab] OR psychiatric[tiab])",
  neuroscience: "neuroscience[tiab] AND (psychiatric OR mental health)",
  psychopharm: "psychopharmacology[tiab] OR antidepressant[tiab]",
};

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
      {
        error:
          "Database not connected — set DATABASE_URL to enable refresh.",
      },
      { status: 503 }
    );
  }

  if (slug !== "pubmed") {
    return NextResponse.json(
      {
        error: `Fetcher for ${source.name} ships in the next iteration. PubMed is wired up.`,
      },
      { status: 501 }
    );
  }

  const db = getDb();
  const [logRow] = await db
    .insert(refreshLog)
    .values({ sourceSlug: slug, kind: "manual", userId })
    .returning({ id: refreshLog.id });

  try {
    let added = 0;
    for (const [topicKey, query] of Object.entries(TOPIC_QUERY)) {
      const ids = await searchPubMed(query, { sinceDays: 35, retmax: 5 });
      if (ids.length === 0) continue;

      const records = await fetchPubMedRecords(ids);
      for (const r of records) {
        const { readingMinutes, jargon } = computeReading(r.abstract);
        const result = await db
          .insert(papers)
          .values({
            sourceSlug: "pubmed",
            externalId: r.pmid,
            doi: r.doi ?? null,
            title: r.title,
            authors: r.authors,
            journal: r.journal ?? null,
            year: r.year ?? null,
            abstract: r.abstract ?? null,
            // BLUF defaults to first sentence of the abstract until AI step lands.
            bluf: firstSentence(r.abstract) ?? r.title,
            blufIsAi: false,
            url: r.url,
            topics: [topicKey],
            readingMinutes,
            jargon: jargon ?? null,
            evidence: "unknown",
            keyStats: [],
          })
          .onConflictDoNothing()
          .returning({ id: papers.id });
        if (result.length > 0) added++;
      }

      // Be polite — small breather between topic queries.
      await new Promise((r) => setTimeout(r, 350));
    }

    // Update counters
    await db
      .insert(sourcesState)
      .values({
        slug,
        requestsToday: 1,
        requestsThisMonth: 1,
        lastRefreshAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sourcesState.slug,
        set: {
          requestsToday: sql`${sourcesState.requestsToday} + 1`,
          requestsThisMonth: sql`${sourcesState.requestsThisMonth} + 1`,
          lastRefreshAt: new Date(),
        },
      });

    await db
      .update(refreshLog)
      .set({ finishedAt: new Date(), papersAdded: added })
      .where(sql`${refreshLog.id} = ${logRow.id}`);

    return NextResponse.json({ ok: true, added });
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
