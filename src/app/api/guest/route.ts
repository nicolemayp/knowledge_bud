import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { getDb, hasDb } from "@/lib/db/client";
import { users, userTopics } from "@/lib/db/schema";
import { setUserCookie } from "@/lib/auth";

const DEFAULT_TOPICS = [
  { key: "cbt", label: "CBT" },
  { key: "dbt", label: "DBT" },
  { key: "trauma", label: "Trauma" },
  { key: "ptsd", label: "PTSD" },
  { key: "depression", label: "Depression" },
  { key: "anxiety", label: "Anxiety" },
  { key: "mindfulness", label: "Mindfulness" },
  { key: "adolescent", label: "Child & adolescent" },
  { key: "neuroscience", label: "Neuroscience" },
  { key: "psychopharm", label: "Psychopharmacology" },
];

export async function POST() {
  // If DB isn't connected yet, set a temp cookie so the user can preview the UI.
  if (!hasDb()) {
    const tempId = createId();
    await setUserCookie(tempId);
    return NextResponse.json({
      userId: tempId,
      mode: "preview",
      message:
        "DATABASE_URL not set — running in preview mode. Connect Neon for persistent guest accounts.",
    });
  }

  try {
    const db = getDb();
    const [u] = await db
      .insert(users)
      .values({ kind: "guest" })
      .returning({ id: users.id });

    // Seed default topics for this user
    await db.insert(userTopics).values(
      DEFAULT_TOPICS.map((t) => ({
        userId: u.id,
        key: t.key,
        label: t.label,
        kind: "default" as const,
        enabled: true,
      }))
    );

    await setUserCookie(u.id);
    return NextResponse.json({ userId: u.id, mode: "live" });
  } catch (e) {
    console.error("[guest] failed:", e);
    return NextResponse.json(
      { error: "Could not create guest account" },
      { status: 500 }
    );
  }
}
