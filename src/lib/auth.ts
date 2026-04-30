import { cookies } from "next/headers";

export const KB_USER_COOKIE = "kb_user";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

export async function getUserId(): Promise<string | null> {
  const c = await cookies();
  return c.get(KB_USER_COOKIE)?.value ?? null;
}

export async function setUserCookie(userId: string) {
  const c = await cookies();
  c.set(KB_USER_COOKIE, userId, COOKIE_OPTS);
}

export async function clearUserCookie() {
  const c = await cookies();
  c.delete(KB_USER_COOKIE);
}
