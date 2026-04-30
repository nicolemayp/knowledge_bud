import { NextResponse } from "next/server";
import { getDb, hasDb } from "@/lib/db/client";
import { sourcesState } from "@/lib/db/schema";

export async function GET() {
  if (!hasDb()) return NextResponse.json({ states: [] });
  try {
    const db = getDb();
    const rows = await db.select().from(sourcesState);
    return NextResponse.json({ states: rows });
  } catch {
    return NextResponse.json({ states: [] });
  }
}
