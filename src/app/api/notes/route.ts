import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { notes } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth";

export async function GET(req: Request) {
  if (!hasDb()) {
    return NextResponse.json({ note: null });
  }
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = new URL(req.url);
  const paperId = url.searchParams.get("paperId");
  if (!paperId) {
    return NextResponse.json({ error: "Missing paperId" }, { status: 400 });
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.paperId, paperId)))
    .limit(1);
  return NextResponse.json({ note: rows[0]?.body ?? null });
}

export async function PUT(req: Request) {
  if (!hasDb()) {
    return NextResponse.json(
      { error: "Database not connected — notes need Neon." },
      { status: 503 }
    );
  }
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { paperId, body } = (await req.json().catch(() => ({}))) as {
    paperId?: string;
    body?: string;
  };
  if (!paperId || typeof body !== "string") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  await db
    .insert(notes)
    .values({ userId, paperId, body })
    .onConflictDoUpdate({
      target: [notes.userId, notes.paperId],
      set: { body, updatedAt: new Date() },
    });
  return NextResponse.json({ ok: true });
}
