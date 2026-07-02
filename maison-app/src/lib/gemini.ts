import { GoogleGenAI } from "@google/genai";

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
