// Heuristic fallback for splitting a task into concrete micro-steps when
// Gemini isn't available — generic enough to not look broken, not meant to
// be as sharp as the AI version.
export function localTaskBreakdown(text: string): string[] {
  return [
    `${text} — ilk 5 dakika: malzemeyi/ekranı önüne aç, başka hiçbir şey yapma`,
    `${text} — ana kısmı yap`,
    `${text} — gözden geçir ve bitti işaretle`,
  ];
}

// A rough, generous estimate — better to have a number to anchor against
// than none at all, even if it's approximate.
export function localTaskEstimate(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words <= 4) return 10;
  if (words <= 10) return 20;
  return 30;
}
