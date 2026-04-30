import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Returns a Drizzle client backed by Neon HTTP.
 * Throws if DATABASE_URL is missing.
 */
export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (local) or your Vercel project (production)."
    );
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export { schema };
