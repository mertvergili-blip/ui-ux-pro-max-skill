import { getGeminiClient, generateWithFallback } from "@/lib/gemini";
import { requireSession } from "@/lib/auth";

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının
asistanısın. Kullanıcı bir koleksiyon projesi için bir görsel yükledi — bu bir
moodboard, bir manipülasyon/kolaj denemesi ya da ilham aldığı bir nesnenin
fotoğrafı olabilir. Görseli bir moda tasarımcısının gözüyle incele: renk
paleti, doku, siluet, ruh hali gibi unsurlardan öne çıkanları belirt ve bu
projeye nasıl bir katkısı olabileceğine dair 1-2 cümlelik kısa, somut bir
yorum yap. Türkçe yaz, düz metin — markdown, yıldız işareti kullanma.`;

// data URLs from resizeImageFile() look like "data:image/jpeg;base64,...."
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

export async function POST(request: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { dataUrl, projectName } = (await request.json()) as {
    dataUrl?: string;
    projectName?: string;
  };
  if (!dataUrl) {
    return Response.json({ error: "dataUrl is required" }, { status: 400 });
  }
  const image = parseDataUrl(dataUrl);
  if (!image) {
    return Response.json({ error: "invalid dataUrl" }, { status: 400 });
  }

  const client = getGeminiClient();
  if (!client) {
    return Response.json({
      insight: "AI görsel incelemesi şu an kullanılamıyor.",
      source: "unavailable",
    });
  }

  try {
    const response = await generateWithFallback(client, {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: projectName
                ? `Proje: ${projectName}. Bu görseli incele.`
                : "Bu görseli incele.",
            },
            { inlineData: { mimeType: image.mimeType, data: image.data } },
          ],
        },
      ],
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const insight = response.text?.trim();
    if (!insight) throw new Error("Empty Gemini response");

    return Response.json({ insight, source: "gemini" });
  } catch {
    return Response.json({
      insight: "Görsel incelenirken bir sorun oluştu, tekrar dener misin?",
      source: "error",
    });
  }
}
