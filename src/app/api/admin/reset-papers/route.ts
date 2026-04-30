import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";

/**
 * Wipe all papers (and dependent bookmarks/notes by FK cascade).
 * Protected by CRON_SECRET — never expose to client.
 *
 * Usage:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     https://knowledge-bud.vercel.app/api/admin/reset-papers
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
  await db.execute(sql`DELETE FROM bookmarks`);
  await db.execute(sql`DELETE FROM notes`);
  await db.execute(sql`DELETE FROM papers`);
  await db.execute(sql`DELETE FROM refresh_log`);
  await db.execute(sql`UPDATE sources_state SET requests_today = 0, requests_this_month = 0, last_refresh_at = NULL`);
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
