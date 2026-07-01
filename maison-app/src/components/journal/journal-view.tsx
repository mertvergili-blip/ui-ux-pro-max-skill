"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore, selectTodayEntry, type MoodKey } from "@/lib/store";

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

export function JournalView() {
  const journalEntries = useStore((s) => s.journalEntries);
  const todayEntry = useMemo(() => selectTodayEntry(journalEntries), [journalEntries]);
  const setTodayMood = useStore((s) => s.setTodayMood);
  const setTodayReflection = useStore((s) => s.setTodayReflection);

  const heatData = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const pseudo = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
        if (pseudo > 0.4) {
          return i > 34 ? 100 : Math.round(pseudo * 70 + 15);
        }
        return 0;
      }),
    []
  );

  const rhythm = useMemo(() => {
    const last7 = journalEntries.slice(-7);
    if (last7.length === 0) {
      return Array.from({ length: 7 }, () => 0.5);
    }
    return Array.from({ length: 7 }, (_, i) => {
      const e = last7[i];
      return e?.mood ? MOOD_HEIGHT[e.mood] : 0.3;
    });
  }, [journalEntries]);

  const editorLetter = useMemo(() => {
    const moods = journalEntries.slice(-7).map((e) => e.mood).filter(Boolean);
    if (moods.length === 0) {
      return "Bu hafta henüz bir ritim oluşmadı — ilk yansımanı bırak, buradan bir özet çıkarayım.";
    }
    const dominant = moods.sort(
      (a, b) =>
        moods.filter((m) => m === b).length - moods.filter((m) => m === a).length
    )[0];
    return `Bu hafta genel tonun "${dominant}" idi. ${moods.length} gün not düştün — bu ritmi korumak koleksiyon III için sağlam bir zemin.`;
  }, [journalEntries]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3px] text-gold">
        <span className="h-px w-7 bg-gold" />
        Journal
      </p>
      <h1 className="mb-2 font-heading text-[34px] font-normal leading-[1.12] text-[#f7f2e6]">
        Bugün nasılsın?
      </h1>

      <div className="my-2 mb-8 flex gap-4">
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
            onClick={() => setTodayMood(m.key)}
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

      <div className="mt-9 grid max-w-[520px] grid-cols-2 gap-10">
        <div>
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
            Energy Rhythm
          </p>
          <div className="flex h-16 items-end gap-1.5">
            {rhythm.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[1px] bg-gold/60 transition-all duration-500"
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
            30 Günlük Ritim
          </p>
          <div className="grid grid-cols-10 gap-1">
            {heatData.map((intensity, i) => (
              <div
                key={i}
                className="aspect-square rounded-[1px]"
                style={{
                  background:
                    intensity > 0
                      ? `color-mix(in srgb, var(--color-gold) ${intensity}%, var(--color-line))`
                      : "var(--color-line)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 max-w-[520px] border-t border-line pt-6">
        <p className="mb-2.5 flex items-center gap-2.5 text-[9.5px] uppercase tracking-[3px] text-muted">
          Weekly Editor Letter
        </p>
        <p className="font-serif text-[17px] italic leading-relaxed text-bone-dim">
          {editorLetter}
        </p>
      </div>
    </motion.div>
  );
}
