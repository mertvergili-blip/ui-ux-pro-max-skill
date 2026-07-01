"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const MILESTONES = [
  {
    year: "2025",
    title: "İlk Koleksiyon",
    detail: "İlk özgün 7 parçalık koleksiyonunu tamamladın — Rosé Poudré.",
    done: true,
  },
  {
    year: "Mart 2026",
    title: "Portfolyo v2",
    detail: "Portfolyonu editorial bir formatla yeniden kurdun.",
    done: true,
  },
  {
    year: "Şimdi",
    title: "Koleksiyon III",
    detail: "Terre & Or üzerinde çalışıyorsun — 6 gün kaldı.",
    active: true,
  },
  {
    year: "2027",
    title: "Staj Başvuruları",
    detail:
      "Büyük markalara staj başvuruların için portfolyo hazır olacak.",
  },
];

export function PathView() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3px] text-gold">
        <span className="h-px w-7 bg-gold" />
        Career Path
      </p>
      <h1 className="mb-7 font-heading text-[34px] font-normal leading-[1.12] text-[#f7f2e6]">
        Creative Director&apos;a giden yol.
      </h1>

      <div className="flex flex-col">
        {MILESTONES.map((m, i) => {
          const isExpanded = expanded === i;
          const isLast = i === MILESTONES.length - 1;
          return (
            <div
              key={i}
              className={`relative cursor-pointer pb-8 pl-[30px] ${
                isLast ? "border-l border-transparent" : "border-l border-line"
              }`}
              onClick={() => setExpanded(isExpanded ? null : i)}
            >
              <div
                className={`absolute -left-[5px] top-0.5 h-[9px] w-[9px] rounded-full transition-all duration-300 ${
                  m.done
                    ? "border border-gold bg-gold"
                    : m.active
                      ? "border border-gold bg-ink shadow-[0_0_0_4px_rgba(196,164,105,0.16)]"
                      : "border border-muted bg-ink"
                }`}
              />
              <p className="mb-1 text-[9.5px] uppercase tracking-[2px] text-muted">
                {m.year}
              </p>
              <p
                className={`font-heading text-lg transition-colors duration-250 hover:text-gold ${
                  m.done || m.active ? "text-bone" : "text-bone-dim"
                }`}
              >
                {m.title}
              </p>
              <div
                className="overflow-hidden transition-all duration-400"
                style={{ maxHeight: isExpanded ? 80 : 0 }}
              >
                <p className="mt-2 text-[13px] leading-relaxed text-bone-dim">
                  {m.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
