/**
 * Canned categorization message — used when Gemini is unavailable, and what
 * powers the project notes "AI categorized this" line before a
 * GEMINI_API_KEY is configured.
 */
export function localNoteInsight(projectName: string): string {
  return `Not aldım — bunu "${projectName}" için 'Konsept Notları' altında kategorize ettim. İstersen bir hatırlatma da ekleyeyim.`;
}
