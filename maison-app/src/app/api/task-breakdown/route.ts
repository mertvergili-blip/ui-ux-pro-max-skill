import { Type } from "@google/genai";
import { getGeminiClient, generateWithFallback } from "@/lib/gemini";
import { localTaskBreakdown, localTaskEstimate } from "@/lib/task-breakdown";
import { requireSession } from "@/lib/auth";

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının
asistanısın. Kullanıcı ADHD'si olan bir moda tasarım öğrencisi ve büyük/muğlak
bir görevi başlatamıyor. Görevi 2-4 tane çok somut, küçük, hemen başlanabilir
mikro-adıma böl (her biri en fazla 10-15 dakika sürmeli, ilk adım özellikle
kolay ve "başlamayı" kolaylaştıran bir adım olsun — örn. "dosyayı aç",
"malzemeleri masaya koy"). Ayrıca görevin tamamı için gerçekçi bir toplam süre
tahmini (dakika olarak) ver. Türkçe yaz, düz metin — markdown, yıldız işareti
kullanma.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    estimatedMinutes: { type: Type.INTEGER },
  },
  required: ["steps", "estimatedMinutes"],
};

export async function POST(request: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { text } = (await request.json()) as { text?: string };
  if (!text || !text.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const client = getGeminiClient();
  if (!client) {
    return Response.json({
      steps: localTaskBreakdown(text),
      estimatedMinutes: localTaskEstimate(text),
      source: "local",
    });
  }

  try {
    const response = await generateWithFallback(client, {
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text ?? "{}") as {
      steps?: string[];
      estimatedMinutes?: number;
    };

    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0 || !parsed.estimatedMinutes) {
      throw new Error("Malformed Gemini response");
    }

    return Response.json({
      steps: parsed.steps,
      estimatedMinutes: parsed.estimatedMinutes,
      source: "gemini",
    });
  } catch {
    return Response.json({
      steps: localTaskBreakdown(text),
      estimatedMinutes: localTaskEstimate(text),
      source: "local",
    });
  }
}
