import { NextResponse } from "next/server";
import { eq, isNotNull } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { papers } from "@/lib/db/schema";
import { summarisePaper, getGroq } from "@/lib/ai";

export const maxDuration = 300;

/**
 * POST /api/admin/resummarize
 * Auth: Bearer ${CRON_SECRET}
 *
 * Re-runs summarisePaper on every paper with an abstract, replacing the
 * stored bluf + clinical_implications. Used after we tweak the AI prompt.
 *
 * Body (optional): { limit?: number }
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json({ error: "No DB" }, { status: 503 });
  }
  if (!getGroq()) {
    return NextResponse.json({ error: "Groq not configured" }, { status: 503 });
  }

  const { limit } = (await req.json().catch(() => ({}))) as { limit?: number };
  const cap = Math.min(limit ?? 200, 200);

  const db = getDb();
  const rows = await db
    .select()
    .from(papers)
    .where(isNotNull(papers.abstract))
    .limit(cap);

  let updated = 0;
  let skipped = 0;
  let dropped = 0;
  let errors = 0;

  // Groq free tier ~30 RPM — pace calls at 2.2s each.
  const PACE_MS = 2200;
  let lastErrors: string[] = [];

  for (const p of rows) {
    if (!p.abstract || p.abstract.length < 200) {
      skipped++;
      continue;
    }
    try {
      const ai = await summarisePaperWithRetry({
        title: p.title,
        abstract: p.abstract,
        evidence: p.evidence,
      });
      if (!ai) {
        errors++;
        continue;
      }
      if ("skip" in ai) {
        await db.delete(papers).where(eq(papers.id, p.id));
        dropped++;
        continue;
      }
      await db
        .update(papers)
        .set({
          bluf: ai.bluf,
          clinicalImplications: ai.clinicalImplications,
          blufIsAi: true,
        })
        .where(eq(papers.id, p.id));
      updated++;
    } catch (e) {
      errors++;
      lastErrors.push(e instanceof Error ? e.message : String(e));
      if (lastErrors.length > 5) lastErrors = lastErrors.slice(-5);
    }
    await sleep(PACE_MS);
  }

  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function summarisePaperWithRetry(input: {
    title: string;
    abstract: string;
    evidence: string;
  }) {
    let attempt = 0;
    while (attempt < 3) {
      const ai = await summarisePaper(input);
      if (ai) return ai;
      attempt++;
      // Linear backoff for rate-limit recovery
      await sleep(2000 * attempt);
    }
    return null;
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    updated,
    skipped,
    dropped,
    errors,
    sampleErrors: lastErrors,
  });
}
