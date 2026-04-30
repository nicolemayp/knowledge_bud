import { NextResponse } from "next/server";
import { getDb, hasDb } from "@/lib/db/client";
import { loginTokens } from "@/lib/db/schema";
import { makeToken, sendMagicLink, TOKEN_TTL_MS } from "@/lib/auth-magic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "No DB" }, { status: 503 });
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const token = makeToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const db = getDb();
  await db.insert(loginTokens).values({ token, email, expiresAt });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://knowledge-bud.vercel.app";
  const link = `${base}/api/auth/verify?token=${token}`;

  const result = await sendMagicLink({ to: email, link });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
