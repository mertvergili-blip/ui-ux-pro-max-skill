export type SuggestionType =
  | "task"
  | "idea"
  | "note"
  | "mood"
  | "deadline"
  | "calendar";

export const SUGGESTION_TYPES: SuggestionType[] = [
  "task",
  "idea",
  "note",
  "mood",
  "deadline",
  "calendar",
];

/**
 * Offline classifier — used when Gemini is unavailable (no API key, network
 * failure, rate limit) so the AI Studio panel never breaks. Also what
 * powers the whole flow before a GEMINI_API_KEY is configured.
 */
export function localClassify(input: string): {
  type: SuggestionType;
  content: string;
} {
  const text = input.trim();
  const lower = text.toLowerCase();

  if (
    /\b(teslim|deadline|son gün|yetiştir)\b/.test(lower) ||
    /\d{1,2}\s?(temmuz|ağustos|eylül|gün)/.test(lower)
  ) {
    return { type: "deadline", content: text };
  }
  if (/\b(hissediyorum|moral|enerji|yorgun|stresli|sakin)\b/.test(lower)) {
    return { type: "mood", content: text };
  }
  if (/\b(randevu|toplantı|görüşme|saat \d)/.test(lower)) {
    return { type: "calendar", content: text };
  }
  if (
    /\b(yapmalıyım|tamamla|bitir|gönder|hazırla|çiz|topla)\b/.test(lower) ||
    /^(brief|ritual|creative challenge)/i.test(text)
  ) {
    return { type: "task", content: text };
  }
  if (/\b(fikir|ne olsa|belki|konsept)\b/.test(lower)) {
    return { type: "idea", content: text };
  }
  return { type: "note", content: text };
}
