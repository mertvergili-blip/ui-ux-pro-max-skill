import { getGeminiClient, generateWithFallback } from "@/lib/gemini";
import { localEditorLetter } from "@/lib/journal-letter";
import type { JournalDay } from "@/lib/store";

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının
"Studio Assistant"ısın. Kullanıcının son 7 günlük journal kayıtlarını (mood
ve serbest metin reflection) okuyup 2-3 cümlelik, editoryal bir "Weekly
Editor Letter" yaz. Ton: sıcak ama gösterişsiz, bir moda dergisi editörünün
notu gibi. Türkçe yaz. Kullanıcıya ikinci tekil şahısla hitap et ("sen").
Sadece verilen günlerdeki bilgiye dayan, uydurma detay ekleme. Reflection
metinleri boşsa sadece mood dağılımına göre yorum yap. Düz metin yaz —
markdown, yıldız işareti ya da madde imi kullanma; çıktı doğrudan arayüzde
düz yazı olarak gösterilecek.`;

export async function POST(request: Request) {
  const { entries } = (await request.json()) as { entries?: JournalDay[] };

  if (!entries) {
    return Response.json({ error: "entries is required" }, { status: 400 });
  }

  const fallback = () => Response.json({ letter: localEditorLetter(entries), source: "local" });

  const client = getGeminiClient();
  if (!client) return fallback();

  const hasContent = entries.some((e) => e.mood || e.reflection.trim());
  if (!hasContent) return fallback();

  try {
    const summary = entries
      .filter((e) => e.mood || e.reflection.trim())
      .map((e) => `${e.date}: mood=${e.mood ?? "yok"}, not="${e.reflection || "yok"}"`)
      .join("\n");

    const response = await generateWithFallback(client, {
      contents: summary,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const letter = response.text?.trim();
    if (!letter) throw new Error("Empty Gemini response");

    return Response.json({ letter, source: "gemini" });
  } catch {
    return fallback();
  }
}
