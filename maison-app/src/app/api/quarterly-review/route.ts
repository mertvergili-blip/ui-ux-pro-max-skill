import { getGeminiClient, generateWithFallback } from "@/lib/gemini";
import { localQuarterlyReview, type QuarterlyStats } from "@/lib/quarterly-review";

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının
asistanısın. Kullanıcı sana kendi günlük istatistiklerini verecek: kaç gün
günlük tuttuğu, baskın ruh hali, güncel seri (streak) ve kaç koleksiyon
üzerinde çalıştığı. Bu verilere dayanarak, 3-4 cümlelik, samimi ama
profesyonel bir "üç aylık öz-değerlendirme" yaz. Kullanıcıyı bir Creative
Director olma yolculuğunda cesaretlendir, güçlü yanını vurgula, nazikçe bir
gelişim alanı öner. Türkçe yaz, düz metin — markdown, yıldız işareti
kullanma. Uydurma detay ekleme, sadece verilen sayılara dayan.`;

export async function POST(request: Request) {
  const stats = (await request.json()) as QuarterlyStats;

  if (typeof stats.entryCount !== "number") {
    return Response.json({ error: "stats payload is required" }, { status: 400 });
  }

  const fallback = () =>
    Response.json({ review: localQuarterlyReview(stats), source: "local" });

  const client = getGeminiClient();
  if (!client) return fallback();

  try {
    const response = await generateWithFallback(client, {
      contents: `Günlük gün sayısı: ${stats.entryCount}\nBaskın ruh hali: ${
        stats.dominantMood ?? "belirsiz"
      }\nGüncel seri: ${stats.streak} gün\nKoleksiyon sayısı: ${stats.collectionsCount}`,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const review = response.text?.trim();
    if (!review) throw new Error("Empty Gemini response");

    return Response.json({ review, source: "gemini" });
  } catch {
    return fallback();
  }
}
