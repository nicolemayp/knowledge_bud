import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";
import { papers, emailDigestPrefs } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth";
import { sendDigest, type DigestPaper } from "@/lib/email";

const SOURCE_LABEL: Record<string, string> = {
  pubmed: "PubMed",
  openalex: "OpenAlex",
  europepmc: "Europe PMC",
  medrxiv: "medRxiv",
  semanticscholar: "Semantic Scholar",
  crossref: "Crossref",
};

/**
 * POST /api/email/test — sends a one-off preview digest to the user's
 * subscribed email using the latest 6 papers in the DB.
 */
export async function POST(req: Request) {
  if (!hasDb())
    return NextResponse.json({ error: "No DB" }, { status: 503 });
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Optional override: { email: "x@y.com" }
  const body = (await req.json().catch(() => ({}))) as { email?: string };

  const db = getDb();
  let to = body.email;
  if (!to) {
    const rows = await db
      .select()
      .from(emailDigestPrefs)
      .where(eq(emailDigestPrefs.userId, userId))
      .limit(1);
    to = rows[0]?.email;
  }
  if (!to) {
    return NextResponse.json(
      { error: "No email on file. Subscribe first or pass {email: '…'}." },
      { status: 400 }
    );
  }

  const recent = await db
    .select()
    .from(papers)
    .orderBy(desc(papers.fetchedAt))
    .limit(6);
  if (recent.length === 0) {
    return NextResponse.json(
      { error: "No papers in DB yet. Refresh a source first." },
      { status: 400 }
    );
  }

  const digestPapers: DigestPaper[] = recent.map((p) => ({
    title: p.title,
    bluf: p.bluf,
    clinicalImplications: p.clinicalImplications,
    source: SOURCE_LABEL[p.sourceSlug] ?? p.sourceSlug,
    journal: p.journal,
    year: p.year,
    evidence: p.evidence !== "unknown" ? p.evidence : null,
    url: p.url,
    topics: p.topics ?? [],
  }));

  const result = await sendDigest({
    to,
    papers: digestPapers,
    isTest: true,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, sent: digestPapers.length, to });
}
