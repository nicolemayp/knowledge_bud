import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { sourcesState } from "@/lib/db/schema";

/**
 * GET /api/sources-state — returns counters for each source.
 * Lazily resets `requestsThisMonth` when the calendar month flips.
 */
export async function GET() {
  if (!hasDb()) return NextResponse.json({ states: [] });
  try {
    const db = getDb();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Lazy reset: zero out requestsThisMonth + lastResetMonth for any row
    // whose lastResetMonth is in a previous month (or null).
    await db.execute(sql`
      UPDATE sources_state
      SET requests_this_month = 0,
          last_reset_month = ${now}
      WHERE last_reset_month IS NULL
         OR to_char(last_reset_month AT TIME ZONE 'UTC', 'YYYY-MM') <> ${monthKey}
    `);

    const rows = await db.select().from(sourcesState);
    return NextResponse.json({ states: rows });
  } catch (e) {
    console.error("[sources-state]", e);
    return NextResponse.json({ states: [] });
  }
}
