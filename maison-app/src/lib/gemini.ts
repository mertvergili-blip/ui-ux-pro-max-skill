import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

let client: GoogleGenAI | null = null;

// Lazy singleton — avoids constructing the client (and reading the env var)
// at module load time for routes that never call it, and avoids recreating
// it on every request.
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export const GEMINI_MODEL = "gemini-2.5-flash";
// Free tier gives flash-lite a much higher daily quota than flash
// (1000/day vs. flash's much lower cap) — every prompt in this app is
// short and simple, so quality loss is negligible, and this becomes the
// backup that keeps AI features alive once flash's quota is exhausted.
export const GEMINI_MODEL_LITE = "gemini-2.5-flash-lite";

function isQuotaError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("429") || message.includes("RESOURCE_EXHAUSTED");
}

// Tries the primary model first, and only on a quota/rate-limit error
// retries once against the lite model. Any other error (bad prompt,
// network issue) propagates immediately — callers already fall back to
// local logic on any thrown error.
export async function generateWithFallback(
  client: GoogleGenAI,
  params: Omit<GenerateContentParameters, "model">
) {
  try {
    return await client.models.generateContent({ ...params, model: GEMINI_MODEL });
  } catch (err) {
    if (!isQuotaError(err)) throw err;
    return client.models.generateContent({ ...params, model: GEMINI_MODEL_LITE });
  }
}
