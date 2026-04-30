import { NextResponse } from "next/server";
import { clearUserCookie } from "@/lib/auth";

export async function GET() {
  await clearUserCookie();
  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000")
  );
}
