import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js convention: prefer .env.local over .env
config({ path: ".env.local" });
config({ path: ".env" }); // fallback

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
