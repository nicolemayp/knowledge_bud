import { NextResponse } from "next/server";
import { GLOSSARY_SEED } from "@/lib/glossary-data";

/** GET /api/glossary?term=RCT  → returns the definition (or null). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const term = url.searchParams.get("term")?.trim();
  if (!term) {
    return NextResponse.json({ entries: GLOSSARY_SEED });
  }
  const lower = term.toLowerCase();
  const entry = GLOSSARY_SEED.find((g) => g.term.toLowerCase() === lower);
  return NextResponse.json({ term, entry: entry ?? null });
}
