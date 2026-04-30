import { NextResponse } from "next/server";
import { eq, isNotNull, and, or, sql } from "drizzle-orm";
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

  const { limit, onlyMissing } = (await req.json().catch(() => ({}))) as {
    limit?: number;
    onlyMissing?: boolean;
  };
  const cap = Math.min(limit ?? 200, 200);

  const db = getDb();
  // Pull abstracts; client-side filter to those missing CI when onlyMissing.
  const allRows = await db
    .select()
    .from(papers)
    .where(isNotNull(papers.abstract))
    .limit(cap * 3);
  const rows =
    onlyMissing === false
      ? allRows.slice(0, cap)
      : allRows
          .filter(
            (r) => !r.clinicalImplications || r.clinicalImplications.length < 50
          )
          .slice(0, cap);

  let updated = 0;
  let skipped = 0;
  let dropped = 0;
  let errors = 0;

  // Groq llama-3.1-8b-instant free tier: 6k TPM. Each call ~1k tokens.
  // 6 calls/min = 10s pacing. Stay safely under the limit.
  const PACE_MS = 5000;
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
