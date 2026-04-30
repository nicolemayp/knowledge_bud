import { NextResponse } from "next/server";
import { eq, and, isNull, gt } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { loginTokens, users } from "@/lib/db/schema";
import { setUserCookie, getUserId } from "@/lib/auth";

/**
 * GET /api/auth/verify?token=...
 *
 * - Validates token (exists, unconsumed, unexpired)
 * - If the cookie holds a guest user, upgrades that user to "registered"
 *   with the email; otherwise creates a new registered user (or finds an
 *   existing one with the email)
 * - Sets the session cookie and redirects to /feed
 */
export async function GET(req: Request) {
  if (!hasDb()) {
    return NextResponse.redirect(new URL("/?err=no-db", req.url));
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?err=missing-token", req.url));
  }

  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(loginTokens)
    .where(
      and(
        eq(loginTokens.token, token),
        isNull(loginTokens.consumedAt),
        gt(loginTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.redirect(new URL("/?err=invalid-or-expired", req.url));
  }
  const t = rows[0];

  // Try to find existing registered user with this email
  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.email, t.email), eq(users.kind, "registered")))
    .limit(1);

  let userId: string;
  if (existing.length > 0) {
    userId = existing[0].id;
    await db
      .update(users)
      .set({ lastSeenAt: now })
      .where(eq(users.id, userId));
  } else {
    // Upgrade current guest user (if any) to registered, else create one
    const guestId = await getUserId();
    if (guestId) {
      const guest = await db
        .select()
        .from(users)
        .where(eq(users.id, guestId))
        .limit(1);
      if (guest.length > 0 && guest[0].kind === "guest") {
        await db
          .update(users)
          .set({ kind: "registered", email: t.email, lastSeenAt: now })
          .where(eq(users.id, guestId));
        userId = guestId;
      } else {
        const [created] = await db
          .insert(users)
          .values({ kind: "registered", email: t.email })
          .returning({ id: users.id });
        userId = created.id;
      }
    } else {
      const [created] = await db
        .insert(users)
        .values({ kind: "registered", email: t.email })
        .returning({ id: users.id });
      userId = created.id;
    }
  }

  // Mark token consumed
  await db
    .update(loginTokens)
    .set({ consumedAt: now, userId })
    .where(eq(loginTokens.token, token));

  await setUserCookie(userId);
  return NextResponse.redirect(new URL("/feed", req.url));
}
