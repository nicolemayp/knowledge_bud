import { PodcastPlayer } from "@/components/PodcastPlayer";
import { EmailSubscribe } from "@/components/EmailSubscribe";
import { PushSubscribe } from "@/components/PushSubscribe";

export default function ListenPage() {
  return (
    <div className="space-y-6 pb-2">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">
          🎙️ Listen & subscribe
        </h1>
        <p className="text-sm text-ink-soft">
          The monthly podcast, the email digest, and push notifications.
          One spot for staying current without opening the app.
        </p>
      </header>

      <section className="rounded-3xl bg-gradient-to-br from-pink-50 via-lavender-50 to-babyblue-50 border border-pink-200 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🎙️</span>
          <span>Monthly podcast</span>
        </h2>
        <PodcastPlayer />
      </section>

      <section className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">📧</span>
          <span>Monthly email digest</span>
        </h2>
        <EmailSubscribe />
      </section>

      <section className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🔔</span>
          <span>Push notifications</span>
        </h2>
        <PushSubscribe />
      </section>

      <p className="text-xs text-ink-mute text-center px-4">
        All AI-generated summaries are clearly labeled. Verify with the
        original sources for clinical decisions. 🌷
      </p>
    </div>
  );
}
