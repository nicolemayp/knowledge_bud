import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { podcastEpisodes } from "@/lib/db/schema";

/** GET /api/podcast — returns the latest podcast episode (or null if none). */
export async function GET() {
  if (!hasDb()) return NextResponse.json({ episode: null });
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(podcastEpisodes)
      .orderBy(desc(podcastEpisodes.createdAt))
      .limit(1);
    return NextResponse.json({ episode: rows[0] ?? null });
  } catch {
    return NextResponse.json({ episode: null });
  }
}
