"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

const MOODS = [
  { key: "flowing", label: "Flowing", gradient: "radial-gradient(circle at 35% 30%, #e7c98f, #7a5a24)", color: "#c4a469" },
  { key: "calm", label: "Calm", gradient: "radial-gradient(circle at 35% 30%, #9bb0c4, #3d5a6c)", color: "#3d5a6c" },
  { key: "stressed", label: "Stressed", gradient: "radial-gradient(circle at 35% 30%, #c98f98, #7a2e2e)", color: "#7a2e2e" },
  { key: "grounded", label: "Grounded", gradient: "radial-gradient(circle at 35% 30%, #b8c9a3, #4f5c42)", color: "#5c6b52" },
  { key: "tired", label: "Tired", gradient: "radial-gradient(circle at 35% 30%, #cfc4b0, #57503f)", color: "#786f5c" },
];

export function JournalView() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const heatData = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        if (Math.random() > 0.4) {
          const intensity = i > 34 ? 100 : Math.round(Math.random() * 70 + 15);
          return intensity;
        }
        return 0;
      }),
    []
  );

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
              selectedMood === m.key
                ? "scale-[1.18] -translate-y-1.5 opacity-100"
                : "opacity-50 hover:scale-[1.12] hover:-translate-y-1 hover:opacity-[0.85]"
            }`}
            style={{
              background: m.gradient,
              boxShadow:
                selectedMood === m.key
                  ? `0 8px 20px -8px ${m.color}`
                  : "none",
              transitionTimingFunction: "cubic-bezier(.3,1.5,.5,1)",
            }}
            onClick={() => setSelectedMood(m.key)}
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
      />

      <p className="mb-3.5 mt-9 text-[9.5px] uppercase tracking-[3px] text-muted">
        30 Günlük Ritim
      </p>
      <div className="grid max-w-[520px] grid-cols-[repeat(20,1fr)] gap-1">
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
    </motion.div>
  );
}
