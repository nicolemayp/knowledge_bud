import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { userTopics } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth";

export async function GET() {
  if (!hasDb()) return NextResponse.json({ topics: [] });
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = getDb();
  const rows = await db
    .select()
    .from(userTopics)
    .where(eq(userTopics.userId, userId));
  return NextResponse.json({ topics: rows });
}

export async function PUT(req: Request) {
  if (!hasDb())
    return NextResponse.json({ error: "No DB" }, { status: 503 });
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { key, label, kind, enabled } = (await req.json().catch(() => ({}))) as {
    key?: string;
    label?: string;
    kind?: "default" | "custom";
    enabled?: boolean;
  };
  if (!key || !label) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const db = getDb();
  await db
    .insert(userTopics)
    .values({
      userId,
      key,
      label,
      kind: kind ?? "default",
      enabled: enabled ?? true,
    })
    .onConflictDoUpdate({
      target: [userTopics.userId, userTopics.key],
      set: { enabled: enabled ?? true, label, kind: kind ?? "default" },
    });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!hasDb())
    return NextResponse.json({ error: "No DB" }, { status: 503 });
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { key } = (await req.json().catch(() => ({}))) as { key?: string };
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  const db = getDb();
  await db
    .delete(userTopics)
    .where(and(eq(userTopics.userId, userId), eq(userTopics.key, key)));
  return NextResponse.json({ ok: true });
}
