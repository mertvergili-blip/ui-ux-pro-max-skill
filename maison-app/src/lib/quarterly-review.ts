import type { JournalDay, MoodKey } from "./store";

export interface QuarterlyStats {
  entryCount: number;
  dominantMood: MoodKey | null;
  streak: number;
  collectionsCount: number;
}

export function computeQuarterlyStats(
  journalEntries: JournalDay[],
  streak: number,
  collectionsCount: number
): QuarterlyStats {
  const moods = journalEntries.map((e) => e.mood).filter((m): m is MoodKey => Boolean(m));
  const counts: Partial<Record<MoodKey, number>> = {};
  for (const m of moods) counts[m] = (counts[m] ?? 0) + 1;
  const dominantMood =
    moods.length === 0
      ? null
      : (Object.keys(counts) as MoodKey[]).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];

  return { entryCount: journalEntries.length, dominantMood, streak, collectionsCount };
}

export function localQuarterlyReview(stats: QuarterlyStats): string {
  if (stats.entryCount === 0) {
    return "Henüz yeterli günlük notu yok — birkaç hafta yansıma biriktir, sonra buradan üç aylık bir öz-değerlendirme çıkarayım.";
  }
  const moodPart = stats.dominantMood
    ? `Bu dönemde genel tonun "${stats.dominantMood}" etrafında şekillendi.`
    : "Bu dönemde ruh halini pek not düşmedin.";
  return `${moodPart} ${stats.entryCount} gün günlük tuttun, ${stats.streak} günlük bir seri sürdürüyorsun ve ${stats.collectionsCount} koleksiyon üzerinde çalışıyorsun. Bu ritmi koruman, Creative Director yolculuğunda tutarlılığının en güçlü kanıtı.`;
}
