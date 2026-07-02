"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RUNWAY_LOOKS } from "@/lib/runway-looks";

const EASE = [0.32, 0.72, 0, 1] as const;
const AUTOPLAY_MS = 3800;

export function RunwayLookCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const look = RUNWAY_LOOKS[index];

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % RUNWAY_LOOKS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused]);

  const advance = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + RUNWAY_LOOKS.length) % RUNWAY_LOOKS.length);
  };

  return (
    <div
      className="group absolute inset-0 z-[3]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={look.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 85% at 50% 42%, color-mix(in srgb, ${look.palette[0]} 22%, transparent), transparent 70%),
              linear-gradient(175deg, color-mix(in srgb, ${look.palette[1]} 88%, var(--color-ink)) 0%, var(--color-ink) 75%)
            `,
          }}
        >
          {/* Abstract silhouette — a soft vertical figure suggestion, not a photo */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0.94 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="absolute left-1/2 top-1/2 h-[62%] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-[60px]"
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${look.palette[0]} 55%, transparent) 0%, transparent 85%)`,
              filter: "blur(1px)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-ink to-transparent to-[14%]" />

      {/* Prev/next — pointer-events enabled, sit above the gradient veil */}
      <div className="pointer-events-none absolute inset-0 z-5 flex items-center justify-between px-6">
        <button
          onClick={() => advance(-1)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-bone-dim opacity-0 transition-opacity duration-300 hover:text-bone hover:opacity-100 group-hover:opacity-60"
        >
          ‹
        </button>
        <button
          onClick={() => advance(1)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-bone-dim opacity-0 transition-opacity duration-300 hover:text-bone hover:opacity-100 group-hover:opacity-60"
        >
          ›
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-11 right-14 z-5 text-right">
        <AnimatePresence mode="wait">
          <motion.div
            key={look.id}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9.5px] uppercase tracking-[2.5px] text-bone-dim backdrop-blur-sm">
              {look.designer} · {look.season}
            </p>
            <p className="font-serif text-xl italic text-bone">{look.mood}</p>
            <p className="mt-1.5 text-[10.5px] uppercase tracking-[1.5px] text-muted">
              Look {String(look.lookNumber).padStart(2, "0")} /{" "}
              {String(look.totalLooks).padStart(2, "0")}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
