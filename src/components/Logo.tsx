import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg"
      ? "text-4xl"
      : size === "sm"
      ? "text-lg"
      : "text-2xl";
  const flower =
    size === "lg" ? "text-5xl" : size === "sm" ? "text-xl" : "text-3xl";

  return (
    <Link
      href="/feed"
      className="inline-flex items-center gap-2 select-none group"
      aria-label="Knowledge Bud home"
    >
      <span className={`${flower} drop-shadow-sm transition-transform group-hover:rotate-12`}>🌸</span>
      <span
        className={`font-display ${text} font-bold bg-gradient-to-r from-pink-500 via-lavender-500 to-babyblue-500 bg-clip-text text-transparent`}
      >
        Knowledge Bud
      </span>
    </Link>
  );
}
