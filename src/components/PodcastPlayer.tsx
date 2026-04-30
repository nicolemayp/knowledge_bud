"use client";

import { useEffect, useState } from "react";

type Episode = {
  monthKey: string;
  title: string;
  description: string | null;
  audioUrl: string | null;
  durationSec: number | null;
  status: string;
};

export function PodcastPlayer() {
  const [ep, setEp] = useState<Episode | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/podcast")
      .then((r) => r.json())
      .then((d) => {
        setEp(d.episode);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <p className="text-sm text-ink-mute italic">Loading…</p>;
  }

  if (!ep || ep.status !== "ready" || !ep.audioUrl) {
    return (
      <div className="text-sm text-ink-soft space-y-2">
        <p>
          🎙️ Monthly podcast is in preview. The first episode drops on the 1st
          of next month — a ~5-minute conversational digest of the month&rsquo;s
          highlights, generated from the feed.
        </p>
        <p className="text-xs text-ink-mute">
          Free TTS (Microsoft Edge voices) · stored on Vercel Blob · subscribable
          RSS feed coming with episode #1.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-display font-bold text-ink">{ep.title}</p>
      {ep.description && (
        <p className="text-sm text-ink-soft">{ep.description}</p>
      )}
      <audio controls preload="none" className="w-full">
        <source src={ep.audioUrl} type="audio/mpeg" />
      </audio>
      {ep.durationSec && (
        <p className="text-[11px] text-ink-mute">
          {Math.floor(ep.durationSec / 60)}:
          {String(ep.durationSec % 60).padStart(2, "0")}
        </p>
      )}
    </div>
  );
}
