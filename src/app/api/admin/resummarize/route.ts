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

  for (const p of rows) {
    if (!p.abstract || p.abstract.length < 200) {
      skipped++;
      continue;
    }
    try {
      const ai = await summarisePaper({
        title: p.title,
        abstract: p.abstract,
        evidence: p.evidence,
      });
      if (!ai) {
        errors++;
        continue;
      }
      if ("skip" in ai) {
        // AI now judges this paper non-clinical — delete it.
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
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    updated,
    skipped,
    dropped,
    errors,
  });
}
