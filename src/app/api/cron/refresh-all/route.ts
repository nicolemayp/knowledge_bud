import { NextResponse } from "next/server";

/**
 * Vercel Cron — runs at 00:00 UTC on the 1st of every month.
 * Vercel sets the Authorization header to `Bearer ${CRON_SECRET}`.
 * https://vercel.com/docs/cron-jobs#securing-cron-jobs
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO(phase-2): for each source, call its fetcher, dedupe new papers,
  // upsert into Neon, log to refresh_log, send email digests / push notifications.
  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    note: "Cron stub — fetchers wire up in next iteration.",
  });
}
