"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Timeline, type TimelineEntry } from "@/components/vendor/timeline";
import { useStore, type CollectionFolder } from "@/lib/store";
import { compileYearArchive, downloadTextFile } from "@/lib/year-archive";

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
    <div
      className="relative overflow-hidden rounded-[1rem] border border-white/[0.07] px-4 py-5"
      style={{
        background: `radial-gradient(90% 100% at 100% 0%, color-mix(in srgb, ${accent} 55%, transparent), transparent 60%), linear-gradient(150deg, color-mix(in srgb, ${accent} 22%, var(--color-ink)), var(--color-ink))`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${accent} 85%, white), ${accent} 55%, transparent 75%)`,
          filter: "blur(22px)",
        }}
      />
      <p className="relative mb-1 text-[9px] uppercase tracking-[2px]" style={{ color: accent }}>
        {sub}
      </p>
      <p className="relative font-heading text-[15px] text-bone">{label}</p>
    </div>
  );
}

// Used to bucket by real collection dates instead of a hand-written year — a
// CollectionFolder has no createdAt/completedAt field, so status ("In
// Progress" vs "Archived") is the one real, structured signal available to
// group by. This trades a literal calendar timeline for an honest one: it
// changes as you actually complete and start collections, instead of
// staying frozen with three fixed years and the same three fake project
// names no matter what you do in the app.
function buildJourney(collections: CollectionFolder[]): TimelineEntry[] {
  const archived = collections.filter((c) => c.status === "Archived");
  const active = collections.filter((c) => c.status !== "Archived");
  const entries: TimelineEntry[] = [];

  if (archived.length > 0) {
    entries.push({
      title: "Tamamlanan",
      content: (
        <div>
          <p className="mb-6 max-w-[420px] text-[13.5px] leading-relaxed text-bone-dim">
            {archived.length === 1
              ? "Bir koleksiyonu tamamladın — kendi elinden çıkan bütünlüklü ilk iş."
              : `${archived.length} koleksiyon tamamladın — arşivin büyüyor.`}
          </p>
          <div className="grid max-w-[420px] grid-cols-2 gap-3">
            {archived.map((c) => (
              <HighlightTile key={c.id} label={c.name} sub={c.sub || "Tamamlandı"} accent={c.accent} />
            ))}
          </div>
        </div>
      ),
    });
  }

  if (active.length > 0) {
    entries.push({
      title: "Şimdi",
      content: (
        <div>
          <p className="mb-6 max-w-[420px] text-[13.5px] leading-relaxed text-bone-dim">
            {active.length === 1
              ? `${active[0].name} üzerinde çalışıyorsun.`
              : `${active.length} koleksiyon aktif — şu an üzerinde çalıştıkların.`}
          </p>
          <div className="grid max-w-[420px] grid-cols-2 gap-3">
            {active.map((c) => (
              <HighlightTile key={c.id} label={c.name} sub={c.sub || c.status} accent={c.accent} />
            ))}
          </div>
        </div>
      ),
    });
  }

  entries.push({
    title: "Sırada",
    content: (
      <div className="max-w-[420px] rounded-[1rem] border border-dashed border-line px-4 py-5">
        <p className="text-[9px] uppercase tracking-[2px] text-muted">Bir sonraki adım</p>
        <p className="font-heading text-[15px] text-bone-dim">
          Yeni bir koleksiyon başlat, arşivin büyümeye devam etsin.
        </p>
      </div>
    ),
  });

  return entries;
}

export function PathView() {
  const collections = useStore((s) => s.collections);
  const journalEntries = useStore((s) => s.journalEntries);
  const streak = useStore((s) => s.streak);
  const [archiveText, setArchiveText] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const journey = buildJourney(collections);

  const handleGenerateArchive = () => {
    const text = compileYearArchive({
      collections,
      journalEntries,
      streak,
      year: new Date().getFullYear(),
    });
    setArchiveText(text);
  };

  // Full raw backup, not the curated year-archive summary above — every
  // task, note, journal entry, material and DNA reference the app holds,
  // as the same JSON blob Postgres stores. Meant to be re-importable, not
  // just readable.
  const handleExportAllData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/state");
      const { data } = await res.json();
      const json = JSON.stringify(data ?? {}, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maison-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="lg:pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        Career Path
      </p>
      <h1 className="mb-7 font-heading text-[28px] font-normal leading-[1.12] text-[#f7f2e6] lg:text-[34px]">
        Creative Director&apos;a giden yol.
      </h1>

      <Timeline data={journey} />

      <div className="mt-12 max-w-[520px] border-t border-line pt-7">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
            Yıl Sonu Arşivi
          </p>
          <div className="flex gap-3 text-[10px] uppercase tracking-[1.5px]">
            <button
              onClick={handleGenerateArchive}
              className="text-muted transition-colors hover:text-gold"
            >
              Oluştur
            </button>
            {archiveText && (
              <button
                onClick={() =>
                  downloadTextFile(`maison-${new Date().getFullYear()}-arsiv.txt`, archiveText)
                }
                className="text-gold hover:text-bone"
              >
                İndir (.txt)
              </button>
            )}
          </div>
        </div>
        {archiveText ? (
          <pre className="whitespace-pre-wrap rounded-[1rem] border border-dashed border-line p-5 font-sans text-[12px] leading-relaxed text-bone-dim">
            {archiveText}
          </pre>
        ) : (
          <p className="text-[12.5px] leading-relaxed text-muted">
            Tüm koleksiyonlarını, günlük ritmini ve seri bilgini tek bir
            arşiv dosyasında derle — indirip saklayabilirsin.
          </p>
        )}
      </div>

      <div className="mt-9 max-w-[520px] border-t border-line pt-7">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
            Tüm Verini Yedekle
          </p>
          <button
            onClick={handleExportAllData}
            disabled={exporting}
            className="text-[10px] uppercase tracking-[1.5px] text-gold transition-colors hover:text-bone disabled:opacity-40"
          >
            {exporting ? "Hazırlanıyor…" : "İndir (.json)"}
          </button>
        </div>
        <p className="text-[12.5px] leading-relaxed text-muted">
          Görevler, notlar, journal kayıtların, materyaller ve DNA
          referansların dahil, uygulamanın tuttuğu her şeyin ham bir
          yedeği — kendi arşivin için sakla.
        </p>
      </div>
    </motion.div>
  );
}
