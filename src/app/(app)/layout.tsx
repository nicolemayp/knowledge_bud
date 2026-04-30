import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BottomTabs } from "@/components/BottomTabs";
import { Logo } from "@/components/Logo";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth gate: anyone (incl. guests) needs a kb_user cookie.
  // The /api/guest route creates a guest user in Neon and sets this cookie.
  const cookieStore = await cookies();
  const userId = cookieStore.get("kb_user")?.value;
  if (!userId) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b hairline">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <Link
            href="/ask"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-100 to-lavender-100 hover:from-pink-200 hover:to-lavender-200 text-pink-600 font-display font-semibold text-sm px-3 py-1.5 border border-pink-200 transition-all"
            aria-label="Ask Knowledge Bud"
          >
            <span aria-hidden="true">🤖</span>
            <span>Ask</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-24 mx-auto w-full max-w-2xl px-4 py-5">
        {children}
      </main>

      <BottomTabs />
    </div>
  );
}
