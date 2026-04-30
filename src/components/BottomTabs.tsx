"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; emoji: string };

const TABS: Tab[] = [
  { href: "/feed", label: "Feed", emoji: "📰" },
  { href: "/topics", label: "Topics", emoji: "🌷" },
  { href: "/guide", label: "Guide", emoji: "📖" },
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 inset-x-0 z-30 border-t hairline bg-white/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto max-w-2xl grid grid-cols-4">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  active ? "text-pink-600" : "text-ink-mute hover:text-lavender-500"
                }`}
              >
                <span
                  className={`text-2xl transition-transform ${
                    active ? "scale-110" : ""
                  }`}
                  aria-hidden="true"
                >
                  {t.emoji}
                </span>
                <span
                  className={`text-[11px] font-display font-semibold ${
                    active ? "" : ""
                  }`}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
