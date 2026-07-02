import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import { localClassify, SUGGESTION_TYPES, type SuggestionType } from "@/lib/classify";

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının asistanısın.
Kullanıcı serbest metinde günlük bir düşünce, görev, fikir, ruh hali, deadline
ya da randevu yazacak. Bunu şu türlerden birine sınıflandır:
- task: yapılacak somut bir iş
- idea: bir konsept/tasarım fikri
- note: genel bir not, kategorilendirilemeyen düşünce
- mood: ruh hali/enerji ifadesi
- deadline: bir teslim tarihi/son gün
- calendar: bir randevu/toplantı/görüşme

"content" alanına kullanıcının orijinal metnini, gereksiz doldurma kelimeleri
temizlenmiş halde, Türkçe olarak koy. Metnin anlamını değiştirme.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: SUGGESTION_TYPES },
    content: { type: Type.STRING },
  },
  required: ["type", "content"],
};

export async function POST(request: Request) {
  const { text } = (await request.json()) as { text?: string };

  if (!text || !text.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const client = getGeminiClient();
  if (!client) {
    return Response.json({ ...localClassify(text), source: "local" });
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text ?? "{}") as {
      type?: string;
      content?: string;
    };

    if (
      !parsed.type ||
      !parsed.content ||
      !SUGGESTION_TYPES.includes(parsed.type as SuggestionType)
    ) {
      throw new Error("Malformed Gemini response");
    }

    return Response.json({
      type: parsed.type as SuggestionType,
      content: parsed.content,
      source: "gemini",
    });
  } catch {
    return Response.json({ ...localClassify(text), source: "local" });
  }
}
