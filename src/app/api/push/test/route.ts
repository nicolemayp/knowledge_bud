import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth";
import { sendPushTo } from "@/lib/push";

/** POST /api/push/test — send a test push to the current user's devices. */
export async function POST() {
  if (!hasDb()) return NextResponse.json({ error: "No DB" }, { status: 503 });
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = getDb();
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  if (subs.length === 0)
    return NextResponse.json(
      { error: "No push subscriptions on file" },
      { status: 400 }
    );
  const results = await Promise.all(
    subs.map((s) =>
      sendPushTo(s, {
        title: "🌸 Knowledge Bud",
        body: "Test notification — push is working!",
        url: "/feed",
      })
    )
  );
  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({ ok: true, sent: okCount, total: subs.length });
}
