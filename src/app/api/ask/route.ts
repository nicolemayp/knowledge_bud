import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { papers as papersTable } from "@/lib/db/schema";
import { askWithContext, getGroq } from "@/lib/ai";
import { SAMPLE_PAPERS } from "@/lib/sample-papers";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!getGroq()) {
    return NextResponse.json({
      answer:
        "AI chat isn't connected yet — set GROQ_API_KEY in your environment to enable it. Get a free key at https://console.groq.com/keys.",
    });
  }

  const { question } = (await req.json().catch(() => ({}))) as {
    question?: string;
  };
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  // Pull up to 30 recent papers for grounding. Fall back to samples if DB empty.
  let context: Parameters<typeof askWithContext>[0]["papers"] = [];
  if (hasDb()) {
    try {
      const db = getDb();
      const rows = await db
        .select({
          id: papersTable.id,
          title: papersTable.title,
          bluf: papersTable.bluf,
          clinicalImplications: papersTable.clinicalImplications,
          abstract: papersTable.abstract,
          journal: papersTable.journal,
          year: papersTable.year,
          evidence: papersTable.evidence,
        })
        .from(papersTable)
        .orderBy(desc(papersTable.fetchedAt))
        .limit(30);
      context = rows.map((r) => ({
        ...r,
        evidence: r.evidence ?? null,
      }));
    } catch (e) {
      console.error("[ask] DB query failed:", e);
    }
  }
  if (context.length === 0) {
    context = SAMPLE_PAPERS.map((p) => ({
      id: p.id,
      title: p.title,
      bluf: p.bluf,
      clinicalImplications: p.clinicalImplications ?? null,
      abstract: p.abstract ?? null,
      journal: p.journal ?? null,
      year: p.year ?? null,
      evidence: p.evidenceKind ?? null,
    }));
  }

  const result = await askWithContext({ question, papers: context });
  if (!result) {
    return NextResponse.json(
      { error: "AI request failed. Try again in a moment." },
      { status: 502 }
    );
  }
  return NextResponse.json({
    answer: result.answer,
    papersUsed: context.length,
    isAi: true,
  });
}
