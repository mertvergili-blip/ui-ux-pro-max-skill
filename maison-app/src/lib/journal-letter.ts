import type { JournalDay, MoodKey } from "./store";

/**
 * Rule-based weekly summary — used when Gemini is unavailable, and what
 * powers the Weekly Editor Letter before a GEMINI_API_KEY is configured.
 */
export function localEditorLetter(last7: JournalDay[]): string {
  const moods = last7.map((e) => e.mood).filter((m): m is MoodKey => Boolean(m));
  if (moods.length === 0) {
    return "Bu hafta henüz bir ritim oluşmadı — ilk yansımanı bırak, buradan bir özet çıkarayım.";
  }
  const counts: Partial<Record<MoodKey, number>> = {};
  for (const m of moods) counts[m] = (counts[m] ?? 0) + 1;
  const dominant = (Object.keys(counts) as MoodKey[]).sort(
    (a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)
  )[0];
  return `Bu hafta genel tonun "${dominant}" idi. ${moods.length} gün not düştün — bu ritmi korumak koleksiyon III için sağlam bir zemin.`;
}
