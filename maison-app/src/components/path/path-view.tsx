"use client";

import { motion } from "framer-motion";
import { Timeline, type TimelineEntry } from "@/components/vendor/timeline";

function HighlightTile({
  label,
  sub,
  accent,
}: {
  label: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-[1rem] bg-white/[0.02] p-1 ring-1 ring-white/[0.06]">
      <div
        className="rounded-[0.75rem] px-4 py-5"
        style={{
          background: `linear-gradient(150deg, color-mix(in srgb, ${accent} 30%, var(--color-ink)), var(--color-ink))`,
        }}
      >
        <p className="mb-1 text-[9px] uppercase tracking-[2px]" style={{ color: accent }}>
          {sub}
        </p>
        <p className="font-heading text-[15px] text-bone">{label}</p>
      </div>
    </div>
  );
}

const YEARS: TimelineEntry[] = [
  {
    title: "2025",
    content: (
      <div>
        <p className="mb-6 max-w-[420px] text-[13.5px] leading-relaxed text-bone-dim">
          İlk özgün koleksiyonunu tamamladın — 7 parça, tamamen kendi elinden
          çıkan ilk bütünlüklü çalışma. Creative Director yolculuğunun
          başlangıç noktası.
        </p>
        <div className="grid max-w-[420px] grid-cols-2 gap-3">
          <HighlightTile label="Rosé Poudré" sub="Okul Projesi" accent="var(--color-rose)" />
          <HighlightTile label="7 Parça" sub="İlk Koleksiyon" accent="var(--color-rose)" />
        </div>
      </div>
    ),
  },
  {
    title: "2026",
    content: (
      <div>
        <p className="mb-6 max-w-[420px] text-[13.5px] leading-relaxed text-bone-dim">
          Portfolyonu editorial bir formatla yeniden kurdun ve ikinci
          koleksiyonunu tamamladın. Şimdi Terre &amp; Or üzerinde çalışıyorsun
          — üçüncü koleksiyon 6 gün sonra teslim.
        </p>
        <div className="grid max-w-[420px] grid-cols-2 gap-3">
          <HighlightTile label="Verre Bleu" sub="Mart · Tamamlandı" accent="var(--color-blue)" />
          <HighlightTile label="Portfolyo v2" sub="Editorial Format" accent="var(--color-blue)" />
          <HighlightTile label="Terre & Or" sub="Şimdi · 6 gün kaldı" accent="var(--color-gold)" />
        </div>
      </div>
    ),
  },
  {
    title: "2027",
    content: (
      <div>
        <p className="mb-6 max-w-[420px] text-[13.5px] leading-relaxed text-bone-dim">
          Büyük markalara staj başvuruların için portfolyo hazır olacak —
          Terre &amp; Or tamamlandığında dördüncü koleksiyon planlaması
          başlayacak.
        </p>
        <div className="max-w-[420px] rounded-[1rem] border border-dashed border-line px-4 py-5">
          <p className="text-[9px] uppercase tracking-[2px] text-muted">
            Beklenen
          </p>
          <p className="font-heading text-[15px] text-bone-dim">
            Staj Başvuruları
          </p>
        </div>
      </div>
    ),
  },
];

export function PathView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        Career Path
      </p>
      <h1 className="mb-7 font-heading text-[34px] font-normal leading-[1.12] text-[#f7f2e6]">
        Creative Director&apos;a giden yol.
      </h1>

      <Timeline data={YEARS} />
    </motion.div>
  );
}
