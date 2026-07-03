import type { CollectionFolder, JournalDay, MoodKey } from "./store";

export interface YearArchiveInput {
  collections: CollectionFolder[];
  journalEntries: JournalDay[];
  streak: number;
  year: number;
}

function dominantMood(entries: JournalDay[]): MoodKey | null {
  const counts: Partial<Record<MoodKey, number>> = {};
  for (const e of entries) if (e.mood) counts[e.mood] = (counts[e.mood] ?? 0) + 1;
  const keys = Object.keys(counts) as MoodKey[];
  if (keys.length === 0) return null;
  return keys.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];
}

// Plain-text export — no server round trip needed, this is just a tidy
// compile of data the app already has, not a new AI-generated narrative.
export function compileYearArchive(input: YearArchiveInput): string {
  const { collections, journalEntries, streak, year } = input;
  const archived = collections.filter((c) => c.status === "Archived");
  const inProgress = collections.filter((c) => c.status !== "Archived");
  const mood = dominantMood(journalEntries);

  const lines: string[] = [
    `MAISON — ${year} Yıl Sonu Arşivi`,
    "=".repeat(32),
    "",
    "KOLEKSİYONLAR",
    ...collections.map((c) => `  · ${c.name} — ${c.status} (${c.images?.length ?? 0} parça)`),
    "",
    "ÖZET",
    `  Tamamlanan koleksiyon: ${archived.length}`,
    `  Devam eden koleksiyon: ${inProgress.length}`,
    `  Güncel seri: ${streak} gün`,
    `  Günlük kaydı: ${journalEntries.length} gün`,
    mood ? `  Baskın ruh hali: ${mood}` : "  Baskın ruh hali: kayıt yetersiz",
    "",
    "Bu arşiv Maison uygulamasından otomatik derlenmiştir.",
  ];

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
