import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <section className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="rounded-3xl bg-white/70 backdrop-blur-sm border border-pink-100 shadow-soft p-8">
          <p className="text-3xl mb-3">💌</p>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">
            Sign in coming soon
          </h1>
          <p className="text-ink-soft text-sm leading-relaxed mb-6">
            We&rsquo;re hooking up email accounts via Neon Auth. For now, you
            can use Knowledge Bud as a guest — your topics will save on this
            device.
          </p>
          <Link
            href="/"
            className="inline-block rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold px-6 py-3 shadow-soft transition-all"
          >
            ← Back
          </Link>
        </div>
      </section>
    </main>
  );
}
