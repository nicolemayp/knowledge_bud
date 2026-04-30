import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { papers as papersTable } from "@/lib/db/schema";

export async function GET() {
  if (!hasDb()) {
    return NextResponse.json({ papers: [], hasDb: false });
  }
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(papersTable)
      .orderBy(desc(papersTable.fetchedAt))
      .limit(60);
    return NextResponse.json({ papers: rows, hasDb: true });
  } catch (e) {
    console.error("[/api/papers]", e);
    return NextResponse.json({ papers: [], hasDb: true, error: "Query failed" });
  }
}
