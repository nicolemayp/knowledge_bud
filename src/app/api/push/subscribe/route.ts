import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth";

export async function GET() {
  if (!hasDb()) return NextResponse.json({ subscribed: false });
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = getDb();
  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  return NextResponse.json({ subscribed: rows.length > 0, count: rows.length });
}

export async function POST(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "No DB" }, { status: 503 });
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { endpoint, keys } = (await req.json().catch(() => ({}))) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  const db = getDb();
  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "No DB" }, { status: 503 });
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { endpoint } = (await req.json().catch(() => ({}))) as {
    endpoint?: string;
  };
  const db = getDb();
  if (endpoint) {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  } else {
    // Remove all of this user's subscriptions
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }
  return NextResponse.json({ ok: true });
}
