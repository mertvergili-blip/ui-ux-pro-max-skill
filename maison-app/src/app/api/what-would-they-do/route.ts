import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import { localWhatWouldTheyDo } from "@/lib/what-would-they-do";

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının
asistanısın. Kullanıcı bir tasarımcının adını verecek. O tasarımcının bilinen
estetik yaklaşımını, felsefesini ve karakteristik tekniklerini kullanarak,
"bu tasarımcı olsan şu an ne yapardın" tarzında, 2. tekil şahısla ("sen")
hitap eden, 1-2 cümlelik kısa ve somut bir tasarım tavsiyesi ver. Gerçek
bilgiye dayan, uydurma. Türkçe yaz, düz metin — markdown, yıldız işareti
kullanma.`;

export async function POST(request: Request) {
  const { designerName } = (await request.json()) as { designerName?: string };

  if (!designerName || !designerName.trim()) {
    return Response.json({ error: "designerName is required" }, { status: 400 });
  }

  const fallback = () =>
    Response.json({ perspective: localWhatWouldTheyDo(designerName), source: "local" });

  const client = getGeminiClient();
  if (!client) return fallback();

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Tasarımcı: ${designerName}`,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const perspective = response.text?.trim();
    if (!perspective) throw new Error("Empty Gemini response");

    return Response.json({ perspective, source: "gemini" });
  } catch {
    return fallback();
  }
}
