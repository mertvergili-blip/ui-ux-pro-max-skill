"use client";

// Every AI-backed feature here falls back to a local keyword/heuristic
// guess when Gemini is unreachable — the right behavior (never show a dead
// end), but presenting a guess with the same confidence as a real model
// answer is its own quiet dishonesty. This is the one place that admits
// the difference, wherever a result renders.
export function AiSourceTag({ source }: { source: "ai" | "local" }) {
  if (source === "ai") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[1px] text-muted">
      Yerel tahmin
    </span>
  );
}
