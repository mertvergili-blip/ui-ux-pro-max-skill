"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, selectTodayEntry, type MoodKey, type JournalDay } from "@/lib/store";
import { localEditorLetter } from "@/lib/journal-letter";
import { computeQuarterlyStats, localQuarterlyReview } from "@/lib/quarterly-review";
import { useTypewriter } from "@/lib/use-typewriter";
import { haptics } from "@/lib/haptics";

const MOOD_LABEL: Record<MoodKey, string> = {
  flowing: "Flowing",
  calm: "Calm",
  stressed: "Stressed",
  grounded: "Grounded",
  tired: "Tired",
};

const MOODS: { key: MoodKey; label: string; gradient: string; color: string }[] = [
  { key: "flowing", label: "Flowing", gradient: "radial-gradient(circle at 35% 30%, #e7c98f, #7a5a24)", color: "#c4a469" },
  { key: "calm", label: "Calm", gradient: "radial-gradient(circle at 35% 30%, #9bb0c4, #3d5a6c)", color: "#3d5a6c" },
  { key: "stressed", label: "Stressed", gradient: "radial-gradient(circle at 35% 30%, #c98f98, #7a2e2e)", color: "#7a2e2e" },
  { key: "grounded", label: "Grounded", gradient: "radial-gradient(circle at 35% 30%, #b8c9a3, #4f5c42)", color: "#5c6b52" },
  { key: "tired", label: "Tired", gradient: "radial-gradient(circle at 35% 30%, #cfc4b0, #57503f)", color: "#786f5c" },
];

const MOOD_HEIGHT: Record<MoodKey, number> = {
  flowing: 0.9,
  grounded: 0.75,
  calm: 0.6,
  tired: 0.35,
  stressed: 0.25,
};

// Real calendar days, most-recent last — a fixed noise pattern used to
// live here, decorating the page with fake activity instead of reflecting
// what the user actually wrote, which is exactly the "just for show"
// problem with a mood/reflection tracker.
function last30Dates(): string[] {
  const out: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function JournalView() {
  const journalEntries = useStore((s) => s.journalEntries);
  const todayEntry = useMemo(() => selectTodayEntry(journalEntries), [journalEntries]);
  const setTodayMood = useStore((s) => s.setTodayMood);
  const setTodayReflection = useStore((s) => s.setTodayReflection);
  const streak = useStore((s) => s.streak);
  const collectionsCount = useStore((s) => s.collections.length);
  const quarterlyReviewText = useStore((s) => s.quarterlyReviewText);
  const quarterlyReviewGeneratedAt = useStore((s) => s.quarterlyReviewGeneratedAt);
  const setQuarterlyReview = useStore((s) => s.setQuarterlyReview);
  const [reviewLoading, setReviewLoading] = useState(false);
  const quarterlyReviewDisplay = useTypewriter(quarterlyReviewText ?? "");

  const generateQuarterlyReview = async () => {
    setReviewLoading(true);
    const stats = computeQuarterlyStats(journalEntries, streak, collectionsCount);
    let review = localQuarterlyReview(stats);
    try {
      const res = await fetch("/api/quarterly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.review) review = data.review;
      }
    } catch {
      // local review already set above
    }
    setQuarterlyReview(review);
    setReviewLoading(false);
  };

  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);

  const entryByDate = useMemo(
    () => new Map(journalEntries.map((e) => [e.date, e])),
    [journalEntries]
  );

  const heatData = useMemo(
    () =>
      last30Dates().map((date) => {
        const entry = entryByDate.get(date);
        const hasEntry = Boolean(entry?.mood || entry?.reflection?.trim());
        return { date, entry, hasEntry };
      }),
    [entryByDate]
  );

  const selectedHistoryEntry = selectedHistoryDate ? entryByDate.get(selectedHistoryDate) : null;

  const rhythm = useMemo(() => {
    const last7 = journalEntries.slice(-7);
    const moodColor = (key: MoodKey) =>
      MOODS.find((m) => m.key === key)?.color ?? "var(--color-bone-dim)";
    if (last7.length === 0) {
      // Thin baseline ticks — chunky gray blocks read as broken data.
      return Array.from({ length: 7 }, () => ({ h: 0.06, color: "var(--color-line)" }));
    }
    return Array.from({ length: 7 }, (_, i) => {
      const e = last7[i];
      return e?.mood
        ? { h: MOOD_HEIGHT[e.mood], color: moodColor(e.mood) }
        : { h: 0.18, color: "var(--color-line)" };
    });
  }, [journalEntries]);

  const last7 = useMemo(() => journalEntries.slice(-7), [journalEntries]);
  const last7Key = useMemo(() => JSON.stringify(last7), [last7]);
  const localLetter = useMemo(() => localEditorLetter(last7), [last7]);

  // Shows the instant local summary right away; geminiLetter only overrides
  // it once a fetch for the *current* last7Key resolves, so a fetch that
  // completes after the user has already moved on can't clobber the view.
  const [geminiLetter, setGeminiLetter] = useState<{ key: string; text: string } | null>(null);
  const editorLetter =
    geminiLetter && geminiLetter.key === last7Key ? geminiLetter.text : localLetter;
  const editorLetterDisplay = useTypewriter(editorLetter);

  useEffect(() => {
    const key = last7Key;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/editor-letter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: last7 satisfies JournalDay[] }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.letter) setGeminiLetter({ key, text: data.letter });
      } catch {
        // local summary already showing — nothing to do
      }
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last7Key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="lg:pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        Journal
      </p>
      <h1 className="mb-2 font-heading text-[28px] font-normal leading-[1.12] text-[#f7f2e6] lg:text-[34px]">
        Bugün nasılsın?
      </h1>

      <div className="my-2 mb-8 flex gap-3 sm:gap-4">
        {MOODS.map((m) => (
          <div
            key={m.key}
            className={`h-14 w-14 cursor-pointer rounded-full transition-all duration-250 ${
              todayEntry.mood === m.key
                ? "scale-[1.18] -translate-y-1.5 opacity-100"
                : "opacity-50 hover:scale-[1.12] hover:-translate-y-1 hover:opacity-[0.85]"
            }`}
            style={{
              background: m.gradient,
              boxShadow:
                todayEntry.mood === m.key ? `0 8px 20px -8px ${m.color}` : "none",
              transitionTimingFunction: "cubic-bezier(.3,1.5,.5,1)",
            }}
            onClick={() => {
              haptics.tap();
              setTodayMood(m.key);
            }}
            title={m.label}
          />
        ))}
      </div>

      <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
        Reflection
      </p>
      <textarea
        className="w-full max-w-[520px] border-b border-line bg-transparent pb-3.5 text-sm leading-relaxed text-bone-dim outline-none placeholder:text-muted"
        style={{ minHeight: 80, resize: "none" }}
        placeholder="Bugünü birkaç cümleyle anlat…"
        value={todayEntry.reflection}
        onChange={(e) => setTodayReflection(e.target.value)}
      />

      <div className="mt-9 grid max-w-[520px] grid-cols-1 gap-10 sm:grid-cols-2">
        <div>
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
            Energy Rhythm
          </p>
          <div className="flex h-16 items-end gap-1.5">
            {rhythm.map((bar, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[1px] opacity-70 transition-all duration-500"
                style={{ height: `${bar.h * 100}%`, background: bar.color }}
              />
            ))}
          </div>
          {journalEntries.length === 0 && (
            <p className="mt-2 text-[10.5px] italic text-muted">
              Mood seçtikçe burada birikecek.
            </p>
          )}
        </div>
        <div>
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
            30 Günlük Ritim
          </p>
          <div className="grid grid-cols-10 gap-1">
            {heatData.map(({ date, entry, hasEntry }) => {
              const color = entry?.mood
                ? MOODS.find((m) => m.key === entry.mood)?.color
                : undefined;
              return (
                <button
                  key={date}
                  onClick={() => hasEntry && setSelectedHistoryDate(selectedHistoryDate === date ? null : date)}
                  disabled={!hasEntry}
                  title={new Date(date + "T00:00:00").toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                  })}
                  className={`aspect-square rounded-[1px] transition-transform ${
                    hasEntry ? "cursor-pointer hover:scale-125" : "cursor-default"
                  } ${selectedHistoryDate === date ? "ring-1 ring-gold" : ""}`}
                  style={{
                    background: hasEntry
                      ? color ?? "color-mix(in srgb, var(--color-bone-dim) 55%, var(--color-line))"
                      : "var(--color-line)",
                    opacity: hasEntry ? 0.85 : 1,
                  }}
                />
              );
            })}
          </div>
          {journalEntries.length === 0 && (
            <p className="mt-2 text-[10.5px] italic text-muted">
              Her gün bir ruh hali seç, burada bir ritme dönüşsün.
            </p>
          )}
          <AnimatePresence mode="wait">
            {selectedHistoryEntry && (
              <motion.div
                key={selectedHistoryDate}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mt-3.5 rounded-[0.75rem] border border-line p-3"
              >
                <p className="mb-1 text-[10px] uppercase tracking-[1.5px] text-muted">
                  {new Date(selectedHistoryEntry.date + "T00:00:00").toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {selectedHistoryEntry.mood && (
                    <span className="text-gold"> · {MOOD_LABEL[selectedHistoryEntry.mood]}</span>
                  )}
                </p>
                {selectedHistoryEntry.reflection ? (
                  <p className="text-[12.5px] leading-relaxed text-bone-dim">
                    {selectedHistoryEntry.reflection}
                  </p>
                ) : (
                  <p className="text-[12px] italic text-muted">Sadece ruh hali kaydedildi.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bento-tile bento-violet relative mt-10 max-w-[520px] px-6 py-6">
        <div className="bento-orb" style={{ width: 120, height: 120, top: -35, right: -30 }} />
        <p className="relative mb-2.5 flex items-center gap-2.5 text-[9.5px] uppercase tracking-[3px] text-white/55">
          Weekly Editor Letter
        </p>
        <p className="relative font-serif text-[17px] italic leading-relaxed text-[#e7e1fb]">
          {editorLetterDisplay}
        </p>
      </div>

      <div className="bento-tile bento-teal relative mt-6 max-w-[520px] px-6 py-6">
        <div className="bento-orb" style={{ width: 120, height: 120, bottom: -35, left: -30 }} />
        <div className="relative mb-2.5 flex items-center justify-between">
          <p className="flex items-center gap-2.5 text-[9.5px] uppercase tracking-[3px] text-white/55">
            Üç Aylık Öz-Değerlendirme
          </p>
          <button
            onClick={generateQuarterlyReview}
            disabled={reviewLoading}
            className="text-[10px] uppercase tracking-[1.5px] text-white/60 transition-colors hover:text-[#d3fff2] disabled:opacity-40"
          >
            {reviewLoading
              ? "Hazırlanıyor…"
              : quarterlyReviewText
              ? "Yenile"
              : "Oluştur"}
          </button>
        </div>
        {quarterlyReviewText ? (
          <>
            <p className="relative font-serif text-[17px] italic leading-relaxed text-[#d3fff2]">
              {quarterlyReviewDisplay}
            </p>
            {quarterlyReviewGeneratedAt && (
              <p className="relative mt-2.5 text-[10.5px] text-white/50">
                {new Date(quarterlyReviewGeneratedAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                tarihinde oluşturuldu
              </p>
            )}
          </>
        ) : (
          <p className="relative text-[12.5px] leading-relaxed text-white/60">
            Günlük ritmini, ruh hali dağılımını ve koleksiyon ilerlemeni
            özetleyen, üç ayda bir güncellediğin daha geniş bir yansıma.
          </p>
        )}
      </div>
    </motion.div>
  );
}
