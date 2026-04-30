import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { papers, podcastEpisodes } from "@/lib/db/schema";
import {
  generateScript,
  scriptToAudio,
  uploadAudio,
  currentMonthKey,
  monthLabel,
  estimateDurationSec,
  type ScriptPaper,
} from "@/lib/podcast";

export const maxDuration = 300;

/**
 * POST /api/podcast/generate
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`.
 * Generates this month's episode (or refreshes if exists) using the
 * 8 most-recent papers as source material.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json({ error: "No DB" }, { status: 503 });
  }

  const db = getDb();
  const monthKey = currentMonthKey();
  const month = monthLabel();

  // Mark episode as "generating" (or insert if missing)
  const existing = await db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.monthKey, monthKey))
    .limit(1);

  const recent = await db
    .select()
    .from(papers)
    .orderBy(desc(papers.fetchedAt))
    .limit(8);

  if (recent.length === 0) {
    return NextResponse.json(
      { error: "No papers in DB to summarize." },
      { status: 400 }
    );
  }

  const sources: ScriptPaper[] = recent.map((p) => ({
    title: p.title,
    bluf: p.bluf,
    clinicalImplications: p.clinicalImplications,
    journal: p.journal,
    year: p.year,
    evidence: p.evidence !== "unknown" ? p.evidence : null,
  }));

  let episodeId: string;
  if (existing.length > 0) {
    episodeId = existing[0].id;
    await db
      .update(podcastEpisodes)
      .set({ status: "generating" })
      .where(eq(podcastEpisodes.id, episodeId));
  } else {
    const [created] = await db
      .insert(podcastEpisodes)
      .values({
        monthKey,
        title: `Knowledge Bud — ${month}`,
        description: null,
        status: "generating",
        paperIds: recent.map((r) => r.id),
      })
      .returning({ id: podcastEpisodes.id });
    episodeId = created.id;
  }

  try {
    const script = await generateScript({ papers: sources, monthLabel: month });
    if (!script) throw new Error("Script generation failed");

    const audio = await scriptToAudio(script);
    if (!audio) throw new Error("TTS failed");

    const audioUrl = await uploadAudio({ monthKey, buffer: audio });
    if (!audioUrl) throw new Error("Blob upload failed");

    const description = firstParagraph(script).slice(0, 240);
    const duration = estimateDurationSec(script);

    await db
      .update(podcastEpisodes)
      .set({
        status: "ready",
        title: `Knowledge Bud — ${month}`,
        description,
        script,
        audioUrl,
        durationSec: duration,
        paperIds: recent.map((r) => r.id),
      })
      .where(eq(podcastEpisodes.id, episodeId));

    return NextResponse.json({
      ok: true,
      episodeId,
      monthKey,
      audioUrl,
      durationSec: duration,
      sourcePapers: recent.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    await db
      .update(podcastEpisodes)
      .set({ status: "failed", description: msg.slice(0, 240) })
      .where(eq(podcastEpisodes.id, episodeId));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function firstParagraph(text: string): string {
  const para = text.split(/\n\s*\n/)[0] ?? text;
  return para.replace(/\s+/g, " ").trim();
}

// Keep this for the unused-import linter
const _keep = sql;
void _keep;
