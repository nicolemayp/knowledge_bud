import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { emailDigestPrefs } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  if (!hasDb()) return NextResponse.json({ subscribed: false });
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = getDb();
  const rows = await db
    .select()
    .from(emailDigestPrefs)
    .where(eq(emailDigestPrefs.userId, userId))
    .limit(1);
  if (rows.length === 0) return NextResponse.json({ subscribed: false });
  return NextResponse.json({
    subscribed: rows[0].monthlyDigest,
    email: rows[0].email,
  });
}

export async function POST(req: Request) {
  if (!hasDb())
    return NextResponse.json({ error: "No DB" }, { status: 503 });
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { email, monthlyDigest } = (await req.json().catch(() => ({}))) as {
    email?: string;
    monthlyDigest?: boolean;
  };
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const db = getDb();
  await db
    .insert(emailDigestPrefs)
    .values({
      userId,
      email,
      monthlyDigest: monthlyDigest ?? true,
    })
    .onConflictDoUpdate({
      target: emailDigestPrefs.userId,
      set: { email, monthlyDigest: monthlyDigest ?? true },
    });
  return NextResponse.json({ ok: true, subscribed: monthlyDigest ?? true });
}

export async function DELETE() {
  if (!hasDb())
    return NextResponse.json({ error: "No DB" }, { status: 503 });
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = getDb();
  await db.delete(emailDigestPrefs).where(eq(emailDigestPrefs.userId, userId));
  return NextResponse.json({ ok: true });
}
