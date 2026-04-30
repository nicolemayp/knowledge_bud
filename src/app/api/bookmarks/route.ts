import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { bookmarks } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth";

export async function POST(req: Request) {
  if (!hasDb()) {
    return NextResponse.json(
      { error: "Database not connected — bookmarks need Neon." },
      { status: 503 }
    );
  }
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { paperId } = (await req.json().catch(() => ({}))) as {
    paperId?: string;
  };
  if (!paperId) {
    return NextResponse.json({ error: "Missing paperId" }, { status: 400 });
  }
  try {
    const db = getDb();
    await db
      .insert(bookmarks)
      .values({ userId, paperId })
      .onConflictDoNothing();
    return NextResponse.json({ saved: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  if (!hasDb()) {
    return NextResponse.json(
      { error: "Database not connected — bookmarks need Neon." },
      { status: 503 }
    );
  }
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { paperId } = (await req.json().catch(() => ({}))) as {
    paperId?: string;
  };
  if (!paperId) {
    return NextResponse.json({ error: "Missing paperId" }, { status: 400 });
  }
  try {
    const db = getDb();
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.paperId, paperId)));
    return NextResponse.json({ saved: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
