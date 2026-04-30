import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="space-y-6 pb-4">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">
          📖 Guide
        </h1>
        <p className="text-sm text-ink-soft">
          A quick walkthrough of how Knowledge Bud works, what to trust, and
          how to make it your own.
        </p>
      </header>

      <Section
        emoji="🌸"
        title="What is Knowledge Bud?"
        body="A monthly digest of new mental health research. We pull from free, vetted sources (PubMed, Europe PMC, OpenAlex, and more) on the 1st of every month, and present each paper as a card with a one-sentence takeaway, key stats, and a link to the original source."
      />

      <Section
        emoji="📰"
        title="The Feed"
        body="Your main view. Scroll Instagram-style through new papers. Tap topic chips at the top to filter. Tap a card to expand the abstract. Tap 'Read source' to open the original publisher."
      />

      <Section
        emoji="💡"
        title="What does BLUF mean?"
        body="Bottom Line Up Front — the one-sentence takeaway shown in big text on each card. It answers 'what does this paper say?' without making you read the whole abstract. If we use AI to write a BLUF (vs. extracting the authors' own words), the card is clearly labeled 'AI summary'."
      />

      <Section
        emoji="🏷️"
        title="Evidence-level badges"
        body="Each card shows what kind of study it is: RCT (randomized controlled trial), Meta-analysis, Cohort, Preprint, etc. Use these to scan for rigor. Meta-analyses sit at the top of the evidence pyramid; preprints haven't been peer-reviewed yet — read with appropriate caution."
      />

      <Section
        emoji="🌷"
        title="Topics"
        body="The Topics tab lets you toggle default topics (CBT, trauma, depression, etc.) on/off and add your own. We match each topic against the new monthly batch. Add anything specific you care about (e.g. 'EMDR for first responders', 'polyvagal theory', 'pediatric OCD')."
      />

      <Section
        emoji="🔄"
        title="Monthly refresh"
        body="Knowledge Bud automatically pulls new research at midnight UTC on the 1st of every month. You don't have to do anything — your feed just updates. You can also manually refresh any individual source from Settings (subject to API limits)."
      />

      <Section
        emoji="📊"
        title="API limits & manual refresh"
        body="Each source has a daily/monthly request budget set by the data provider (e.g., PubMed allows 10 requests/sec with a free key). The Settings tab shows each source's usage so far this month and a Refresh button. Manual refresh is gently rate-limited per user to protect the shared budget."
      />

      <Section
        emoji="🔖"
        title="Save & Notes"
        body="Tap the 🔖 Save button on any card to bookmark it. Add private notes to any paper for later — great for therapists collecting evidence for client work or grad students writing literature reviews."
      />

      <Section
        emoji="🎧"
        title="Audio mode"
        body="On any expanded card, hit the 🎧 button to have the abstract read aloud. Uses your browser's built-in text-to-speech — free, no third-party. Good for commutes or accessibility."
      />

      <Section
        emoji="🤖"
        title="Ask Knowledge Bud"
        body="The 'Ask' button (top-right of every page) opens an AI chat that answers your questions using ONLY the papers in your feed. It always cites which papers it pulled from, so you can verify. AI responses are clearly labeled — always check the original source."
      />

      <Section
        emoji="📚"
        title="Glossary"
        body="See an unfamiliar term? Tap it for a friendly definition. Helpful for non-clinicians and students just getting started."
      />

      <Section
        emoji="🔒"
        title="Guest mode vs. account"
        body="Guest mode gives you a private, anonymous account stored securely in our Neon cloud DB — no email or password. Your topics, bookmarks, and notes are tied to a long-lived cookie in this browser. Sign up later (with email) to access them on any device."
      />

      <Section
        emoji="🌐"
        title="Sources we use (all free, all vetted)"
        body="PubMed (NIH/NLM), Europe PMC, OpenAlex, Semantic Scholar, medRxiv, PLOS, DOAJ, Crossref, NIMH RSS, SAMHSA RSS, WHO Mental Health. See Settings for each source's limits and last refresh."
      />

      <div className="rounded-3xl bg-gradient-to-br from-pink-100 via-lavender-100 to-babyblue-100 border border-pink-200 p-5 text-center">
        <p className="text-3xl mb-2">🌱</p>
        <p className="font-display font-bold text-lg text-ink mb-1">
          Ready to dive in?
        </p>
        <p className="text-sm text-ink-soft mb-4">
          Head to the Feed and start exploring. Toggle topics to make it yours.
        </p>
        <Link
          href="/feed"
          className="inline-block rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold px-6 py-2.5 shadow-soft"
        >
          Open Feed →
        </Link>
      </div>
    </div>
  );
}

function Section({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5">
      <h2 className="font-display font-bold text-lg text-ink mb-1.5">
        <span className="mr-2 text-xl" aria-hidden="true">
          {emoji}
        </span>
        {title}
      </h2>
      <p className="text-sm text-ink-soft leading-relaxed">{body}</p>
    </section>
  );
}
